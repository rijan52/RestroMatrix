import crypto from "crypto";
import orderModel from "../models/orderModel.js";
import customerModel from "../models/customerModel.js";
import driverModel from "../models/driverModel.js";

const MIN_CHARGE_NPR = 50

const getEsewaConfig = () => {
    const env = process.env.ESEWA_ENV || "sandbox"
    const endpoint = env === "live"
        ? "https://epay.esewa.com.np/api/epay/main/v2/form"
        : "https://rc-epay.esewa.com.np/api/epay/main/v2/form"
    const statusEndpoint = env === "live"
        ? "https://epay.esewa.com.np/api/epay/transaction/status/"
        : "https://rc-epay.esewa.com.np/api/epay/transaction/status/"

    return {
        env,
        endpoint,
        statusEndpoint,
        productCode: process.env.ESEWA_PRODUCT_CODE || "EPAYTEST",
        secretKey: process.env.ESEWA_SECRET_KEY || "8gBm/:&EnhH.1/q"
    }
}

const calculateOrderTotals = (items, deliveryFee) => {
    const itemsTotal = items.reduce((sum, item) => {
        const price = Number(item.price)
        const quantity = Number(item.quantity)
        if (Number.isNaN(price) || Number.isNaN(quantity)) {
            return sum
        }
        return sum + (price * quantity)
    }, 0)
    return {
        itemsTotal,
        deliveryFee,
        totalAmount: itemsTotal + deliveryFee
    }
}

const formatAmount = (amount) => Number(amount).toFixed(2)

const signEsewaPayload = ({ total_amount, transaction_uuid, product_code }, secretKey) => {
    const message = `total_amount=${total_amount},transaction_uuid=${transaction_uuid},product_code=${product_code}`
    return crypto
        .createHmac("sha256", secretKey)
        .update(message)
        .digest("base64")
}

//placing user order for frontend

const placeOrder = async (req, res) => {
    const frontend_url = process.env.FRONTEND_URL || "http://localhost:5173";
    const backend_url = process.env.BACKEND_URL || "http://localhost:4000";

    try {
        const esewaConfig = getEsewaConfig()
        if (!esewaConfig.productCode || !esewaConfig.secretKey) {
            return res.json({ success: false, message: "eSewa credentials missing" })
        }

        if (!Array.isArray(req.body.items) || req.body.items.length === 0) {
            return res.json({ success: false, message: "Cart is empty" })
        }

        const newOrder = new orderModel({
            userId: req.userId,
            items: req.body.items,
            amount: req.body.amount,
            address: req.body.address
        })
        await newOrder.save();
        await customerModel.findByIdAndUpdate(req.userId, { cartData: {} })

        const deliveryFeeNpr = 2
        const totals = calculateOrderTotals(req.body.items, deliveryFeeNpr)

        if (totals.totalAmount < MIN_CHARGE_NPR) {
            return res.json({
                success: false,
                message: `Minimum order amount is Rs ${MIN_CHARGE_NPR}. Please add more items.`
            })
        }

        // eSewa v2 REQUIRED FIELDS - all amounts as strings with 2 decimal places
        const itemAmount = formatAmount(totals.itemsTotal);
        const taxAmount = formatAmount(0);
        const deliveryCharge = formatAmount(totals.deliveryFee);
        const serviceCharge = formatAmount(0);

        // CRITICAL: total_amount = amount + tax_amount + product_service_charge + product_delivery_charge
        const totalAmountCalculated = formatAmount(
            parseFloat(itemAmount) +
            parseFloat(taxAmount) +
            parseFloat(serviceCharge) +
            parseFloat(deliveryCharge)
        );

        const paymentPayload = {
            // REQUIRED CORE FIELDS (all as strings with 2 decimals)
            amount: itemAmount,
            tax_amount: taxAmount,
            total_amount: totalAmountCalculated,
            transaction_uuid: String(newOrder._id),
            product_code: esewaConfig.productCode,
            product_name: `Food Order #${newOrder._id.toString().slice(-6).toUpperCase()}`,

            // REQUIRED CHARGE FIELDS
            product_service_charge: serviceCharge,
            product_delivery_charge: deliveryCharge,

            // REQUIRED CALLBACK URLs (properly encoded)
            success_url: `${backend_url}/api/payment/success?transaction_uuid=${encodeURIComponent(String(newOrder._id))}`,
            failure_url: `${backend_url}/api/payment/failure?transaction_uuid=${encodeURIComponent(String(newOrder._id))}`,

            // REQUIRED SIGNATURE FIELD
            signed_field_names: "total_amount,transaction_uuid,product_code"
        };

        const signature = signEsewaPayload(
            {
                total_amount: paymentPayload.total_amount,
                transaction_uuid: paymentPayload.transaction_uuid,
                product_code: paymentPayload.product_code
            },
            esewaConfig.secretKey
        );

        console.log('Order Payment Debug Info:');
        console.log('Order ID:', newOrder._id);
        console.log('Item Amount:', itemAmount);
        console.log('Delivery Charge:', deliveryCharge);
        console.log('Total Amount:', totalAmountCalculated);
        console.log('Signature Message:', `total_amount=${paymentPayload.total_amount},transaction_uuid=${paymentPayload.transaction_uuid},product_code=${paymentPayload.product_code}`);
        console.log('Signature:', signature);

        res.json({
            success: true,
            message: "Order placed successfully. Redirecting to payment...",
            payment: {
                endpoint: esewaConfig.endpoint,
                params: {
                    amount: paymentPayload.amount,
                    tax_amount: paymentPayload.tax_amount,
                    total_amount: paymentPayload.total_amount,
                    transaction_uuid: paymentPayload.transaction_uuid,
                    product_code: paymentPayload.product_code,
                    product_name: paymentPayload.product_name,
                    product_service_charge: paymentPayload.product_service_charge,
                    product_delivery_charge: paymentPayload.product_delivery_charge,
                    success_url: paymentPayload.success_url,
                    failure_url: paymentPayload.failure_url,
                    signed_field_names: paymentPayload.signed_field_names,
                    signature: signature
                }
            }
        })

    } catch (error) {
        console.error("Order Placement Error:", error);
        res.json({ success: false, message: error?.message || "Error placing order. Please check that cart is not empty and all details are filled." })
    }
}

const verifyOrder = async (req, res) => {
    const { status, transaction_uuid, total_amount } = req.body;
    try {
        if (!transaction_uuid || !total_amount) {
            return res.json({ success: false, message: "Missing transaction data" })
        }

        if (status !== "COMPLETE") {
            await orderModel.findByIdAndDelete(transaction_uuid);
            return res.json({ success: false, message: "Payment not completed" })
        }

        const esewaConfig = getEsewaConfig()
        if (!esewaConfig.productCode) {
            return res.json({ success: false, message: "eSewa product code missing" })
        }

        const statusUrl = `${esewaConfig.statusEndpoint}?product_code=${encodeURIComponent(esewaConfig.productCode)}&total_amount=${encodeURIComponent(total_amount)}&transaction_uuid=${encodeURIComponent(transaction_uuid)}`
        const statusResponse = await fetch(statusUrl)
        const statusData = await statusResponse.json()

        if (statusData?.status === "COMPLETE") {
            await orderModel.findByIdAndUpdate(transaction_uuid, { payment: true })
            return res.json({ success: true, message: "Paid" })
        }

        await orderModel.findByIdAndDelete(transaction_uuid)
        return res.json({ success: false, message: "Payment not verified" })
    } catch (error) {
        console.log(error);
        res.json({ success: false, message: "Error" })
    }
}

// Handle eSewa payment success callback (GET request from eSewa redirect)
const paymentSuccess = async (req, res) => {
    try {
        console.log("\n=== Payment Success Callback ===");
        console.log("All Query Params:", req.query);

        let transaction_uuid, status, total_amount, transaction_code;

        // eSewa sometimes sends data as base64-encoded JSON in a 'data' parameter
        if (req.query.data) {
            try {
                const decodedData = Buffer.from(req.query.data, 'base64').toString('utf8');
                const paymentData = JSON.parse(decodedData);

                transaction_uuid = paymentData.transaction_uuid;
                status = paymentData.status;
                total_amount = paymentData.total_amount;
                transaction_code = paymentData.transaction_code;

                console.log("Decoded from data parameter:");
                console.log("Transaction UUID:", transaction_uuid);
                console.log("Status:", status);
                console.log("Total Amount:", total_amount);
                console.log("Transaction Code:", transaction_code);
            } catch (decodeError) {
                console.error("❌ Failed to decode data parameter:", decodeError);
            }
        } else {
            // Fallback to query parameters
            transaction_uuid = req.query.transaction_uuid || req.query.transaction_uid;
            status = req.query.status;
            total_amount = req.query.total_amount;
            transaction_code = req.query.transaction_code;
        }

        // Clean up transaction_uuid (remove any appended query strings)
        if (transaction_uuid && transaction_uuid.includes('?')) {
            transaction_uuid = transaction_uuid.split('?')[0];
            console.log("Cleaned transaction UUID:", transaction_uuid);
        }

        console.log("================================\n");

        if (!transaction_uuid) {
            console.error("❌ No transaction UUID found in query params or data");
            console.error("Query params were:", req.query);
            return res.json({ success: false, message: "Payment not found" });
        }

        // Try to find the order by ID
        let order = await orderModel.findById(transaction_uuid);

        if (!order) {
            console.error("❌ Order not found for ID:", transaction_uuid);
            console.error("Searching with transaction_uuid:", transaction_uuid);
            return res.json({ success: false, message: "Payment not found" });
        }

        // Check if already paid
        if (order.payment === true) {
            console.log("⚠️ Order already marked as paid");
            return res.json({ success: true, message: "Payment already processed" });
        }

        // Update order as paid (eSewa sends COMPLETE in lowercase or uppercase)
        const validStatus = status === "COMPLETE" || status === "Completed" || status === "COMPLETE";

        if (!validStatus) {
            console.error("❌ Invalid payment status:", status);
            order.payment = false;
            order.paymentStatus = "failed";
            await order.save();
            return res.json({ success: false, message: `Payment ${status}` });
        }

        // Mark order as paid
        order.payment = true;
        order.paymentStatus = "completed";
        order.esewaTransactionCode = transaction_code || "";
        order.esewaTransactionId = transaction_uuid;
        await order.save();

        console.log("✅ Order marked as paid:", transaction_uuid);

        res.json({
            success: true,
            message: "Payment verified successfully",
            orderId: transaction_uuid
        });

    } catch (error) {
        console.error("[Payment Success Error]", error);
        res.json({ success: false, message: error.message });
    }
}

// Handle eSewa payment failure callback
const paymentFailure = async (req, res) => {
    try {
        console.log("[Payment Failure] Query params:", req.query);

        let transaction_uuid;

        // Handle data parameter if present (base64-encoded JSON)
        if (req.query.data) {
            try {
                const decodedData = Buffer.from(req.query.data, 'base64').toString('utf8');
                const paymentData = JSON.parse(decodedData);
                transaction_uuid = paymentData.transaction_uuid;
                console.log("[Payment Failure] Decoded transaction UUID:", transaction_uuid);
            } catch (decodeError) {
                console.error("[Payment Failure] Failed to decode data:", decodeError);
                transaction_uuid = req.query.transaction_uuid || req.query.transaction_uid;
            }
        } else {
            transaction_uuid = req.query.transaction_uuid || req.query.transaction_uid;
        }

        // Clean up if appended with query string
        if (transaction_uuid && transaction_uuid.includes('?')) {
            transaction_uuid = transaction_uuid.split('?')[0];
        }

        console.log("[Payment Failure] Cleaned transaction UUID:", transaction_uuid);

        if (!transaction_uuid) {
            return res.json({ success: false, message: "Transaction ID not found" });
        }

        // Mark order as payment failed (keep order for retry)
        await orderModel.findByIdAndUpdate(transaction_uuid, {
            payment: false,
            paymentStatus: "failed"
        });

        res.json({
            success: false,
            message: "Payment failed. Please retry",
            orderId: transaction_uuid
        });

    } catch (error) {
        console.error("[Payment Failure Error]", error);
        res.json({ success: false, message: error.message });
    }
}

// user orders for frontend

const userOrders = async (req, res) => {
    try {
        const orders = await orderModel.find({ userId: req.body.userId, payment: true }).sort({ date: -1 });
        res.json({ success: true, data: orders })
    }
    catch (error) {
        console.log(error);
        res.json({ success: false, message: "Error" })
    }
}

// Listing orders for admin panel

const listOrders = async (req, res) => {
    try {
        const orders = await orderModel
            .find({
                $or: [
                    { payment: true },
                    { source: "qr" },
                    { tableNumber: { $exists: true, $ne: "" } }
                ]
            })
            .sort({ date: -1 });
        res.json({ success: true, data: orders })
    } catch (error) {
        console.log(error);
        res.json({ success: false, message: "Error" })
    }
}

// api for updating order status 
const updateOrderStatus = async (req, res) => {
    try {
        console.log("Updating order:", req.body.orderId, "to status:", req.body.status);
        const updateData = { status: req.body.status }

        // If status is "Out for delivery" and driverName is provided, add driver details
        if (req.body.status === "Out for delivery" && req.body.driverName) {
            updateData.driverName = req.body.driverName

            // Fetch driver details from driver model
            try {
                const driver = await driverModel.findOne({
                    name: req.body.driverName
                })

                if (driver) {
                    updateData.driverId = driver._id.toString();
                    updateData.driverPhone = driver.phone
                    updateData.driverVehicle = driver.vehicle
                    updateData.driverRating = driver.rating || 0
                }
            } catch (driverError) {
                console.log("Error fetching driver details:", driverError)
            }
        }

        const result = await orderModel.findByIdAndUpdate(req.body.orderId, updateData)
        if (!result) {
            return res.json({ success: false, message: "Order not found" })
        }
        console.log("Order updated successfully");
        res.json({ success: true, message: "Order Status Updated" })
    } catch (error) {
        console.log("Error updating order:", error);
        res.json({ success: false, message: "Error" })
    }
}

// Get a single order by ID
const getOrderById = async (req, res) => {
    try {
        const { orderId } = req.params
        const order = await orderModel.findById(orderId)

        if (!order) {
            return res.json({ success: false, message: "Order not found" })
        }

        res.json({ success: true, data: order })
    } catch (error) {
        console.log(error)
        res.json({ success: false, message: "Error fetching order" })
    }
}

// Get assigned orders for a specific driver
const getDriverAssignedOrders = async (req, res) => {
    try {
        // Get driver's details from driver model
        const driver = await driverModel.findById(req.userId)

        if (!driver) {
            return res.json({ success: false, message: "Driver not found" })
        }

        // Find orders assigned to this driver
        const orders = await orderModel.find({
            driverName: driver.name,
            status: { $in: ["Confirmed", "Out for delivery"] }
        }).sort({ date: -1 })

        // ✅ Add driverId to each order for socket communication
        const ordersWithDriver = orders.map(order => ({
            ...order.toObject(),
            driverId: req.userId  // Include driver ID for socket emit
        }))

        console.log(`✅ Fetched ${ordersWithDriver.length} assigned orders for driver ${req.userId}`)
        res.json({ success: true, data: ordersWithDriver })
    } catch (error) {
        console.log(error)
        res.json({ success: false, message: "Error fetching assigned orders" })
    }
}

export { placeOrder, verifyOrder, userOrders, listOrders, updateOrderStatus, getOrderById, getDriverAssignedOrders, paymentSuccess, paymentFailure }