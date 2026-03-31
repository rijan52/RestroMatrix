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
// Payment is handled directly - order payment status is "Pending" until manually verified

const placeOrder = async (req, res) => {
    try {
        // Validate cart items
        if (!Array.isArray(req.body.items) || req.body.items.length === 0) {
            return res.json({ success: false, message: "Cart is empty" })
        }

        // Validate address
        if (!req.body.address) {
            return res.json({ success: false, message: "Delivery address is required" })
        }

        // Calculate order totals
        const deliveryFeeNpr = 150
        const totals = calculateOrderTotals(req.body.items, deliveryFeeNpr)

        if (totals.totalAmount < MIN_CHARGE_NPR) {
            return res.json({
                success: false,
                message: `Minimum order amount is Rs ${MIN_CHARGE_NPR}. Please add more items.`
            })
        }

        // Create new order
        const newOrder = new orderModel({
            userId: req.userId,
            restaurantId: req.body.restaurantId, // Must be sent from frontend
            items: req.body.items,
            amount: totals.totalAmount,
            address: req.body.address,
            paymentStatus: "Pending",  // Payment status set to Pending (not yet verified)
            payment: false              // payment flag remains false until verified
        })
        await newOrder.save()

        // Clear user's cart
        await customerModel.findByIdAndUpdate(req.userId, { cartData: {} })

        console.log('Order placed successfully:');
        console.log('Order ID:', newOrder._id);
        console.log('Items Total:', totals.itemsTotal);
        console.log('Delivery Fee:', totals.deliveryFee);
        console.log('Total Amount:', totals.totalAmount);
        console.log('Payment Status: Pending');

        // Return success response with order details
        res.json({
            success: true,
            message: "Order placed successfully!",
            orderId: newOrder._id,
            orderDetails: {
                orderId: newOrder._id,
                itemsTotal: totals.itemsTotal,
                deliveryFee: totals.deliveryFee,
                totalAmount: totals.totalAmount,
                paymentStatus: "Pending",
                items: newOrder.items,
                address: newOrder.address
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
            // Find and delete order by transaction ID, not by _id
            await orderModel.findOneAndDelete({ esewaTransactionId: transaction_uuid });
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
            await orderModel.findOneAndUpdate({ esewaTransactionId: transaction_uuid }, { payment: true })
            return res.json({ success: true, message: "Paid" })
        }

        await orderModel.findOneAndDelete({ esewaTransactionId: transaction_uuid })
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
        let transaction_uuid_raw = req.query.transaction_uuid;

        // Case 1: Data is embedded in transaction_uuid as ?data=BASE64
        if (transaction_uuid_raw && transaction_uuid_raw.includes('?data=')) {
            console.log("✓ Detected embedded data in transaction_uuid");
            const [cleanUuid, encodedData] = transaction_uuid_raw.split('?data=');
            transaction_uuid = cleanUuid;

            try {
                const decodedData = Buffer.from(encodedData, 'base64').toString('utf8');
                const paymentData = JSON.parse(decodedData);

                status = paymentData.status;
                total_amount = paymentData.total_amount;
                transaction_code = paymentData.transaction_code;

                console.log("Decoded from embedded data:");
                console.log("  Transaction UUID:", transaction_uuid);
                console.log("  Status:", status);
                console.log("  Total Amount:", total_amount);
                console.log("  Transaction Code:", transaction_code);
            } catch (decodeError) {
                console.error("Failed to decode embedded data:", decodeError.message);
                return res.json({ success: false, message: "Failed to decode payment data" });
            }
        }
        // Case 2: Data is in separate 'data' query parameter
        else if (req.query.data) {
            console.log("✓ Detected separate data parameter");
            transaction_uuid = transaction_uuid_raw;

            try {
                const decodedData = Buffer.from(req.query.data, 'base64').toString('utf8');
                const paymentData = JSON.parse(decodedData);

                status = paymentData.status;
                total_amount = paymentData.total_amount;
                transaction_code = paymentData.transaction_code;

                console.log(" Decoded from data parameter:");
                console.log("  Transaction UUID:", transaction_uuid);
                console.log("  Status:", status);
                console.log("  Total Amount:", total_amount);
                console.log("  Transaction Code:", transaction_code);
            } catch (decodeError) {
                console.error("Failed to decode data parameter:", decodeError.message);
                return res.json({ success: false, message: "Failed to decode payment data" });
            }
        }
        // Case 3: Fallback to direct query parameters
        else {
            console.log("Using direct query parameters");
            transaction_uuid = transaction_uuid_raw;
            status = req.query.status;
            total_amount = req.query.total_amount;
            transaction_code = req.query.transaction_code;

            console.log("  Transaction UUID:", transaction_uuid);
            console.log("  Status:", status);
            console.log("  Total Amount:", total_amount);
            console.log("  Transaction Code:", transaction_code);
        }

        console.log("================================\n");

        if (!transaction_uuid) {
            console.error("No transaction UUID found in query params or data");
            console.error("Query params were:", req.query);
            return res.json({ success: false, message: "Payment not found" });
        }

        // Try to find the order by transaction UUID field instead of order ID
        let order = await orderModel.findOne({ esewaTransactionId: transaction_uuid });

        if (!order) {
            console.error("Order not found for transaction UUID:", transaction_uuid);
            console.error("Searching with transaction_uuid:", transaction_uuid);
            return res.json({ success: false, message: "Payment not found" });
        }

        // Check if already paid
        if (order.payment === true) {
            console.log("Order already marked as paid");
            return res.json({ success: true, message: "Payment already processed" });
        }

        // Update order as paid (eSewa sends COMPLETE in lowercase or uppercase)
        const validStatus = status === "COMPLETE" || status === "Completed" || status === "COMPLETE";

        if (!validStatus) {
            console.error("Invalid payment status:", status);
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

        console.log("Order marked as paid:", transaction_uuid);

        // Redirect to frontend order page with transaction UUID
        const frontendUrl = process.env.FRONTEND_URL || "http://localhost:5173";
        // Use restaurantId in redirect if available
        const restaurantId = order.restaurantId || "";
        if (restaurantId) {
            return res.redirect(`${frontendUrl}/restaurant/${restaurantId}/myorders?payment_success=true&transaction_uuid=${transaction_uuid}&orderId=${order._id.toString()}`);
        } else {
            return res.redirect(`${frontendUrl}/myorders?payment_success=true&transaction_uuid=${transaction_uuid}&orderId=${order._id.toString()}`);
        }

    } catch (error) {
        console.error("[Payment Success Error]", error);
        const frontendUrl = process.env.FRONTEND_URL || "http://localhost:5173";
        return res.redirect(`${frontendUrl}/myorders?payment_success=false&error=${encodeURIComponent(error.message)}`);
    }
}

// Handle eSewa payment failure callback
const paymentFailure = async (req, res) => {
    try {
        console.log("[Payment Failure] Query params:", req.query);

        let transaction_uuid;
        let transaction_uuid_raw = req.query.transaction_uuid;

        // Case 1: Data is embedded in transaction_uuid as ?data=BASE64
        if (transaction_uuid_raw && transaction_uuid_raw.includes('?data=')) {
            console.log("Detected embedded data in transaction_uuid");
            const [cleanUuid, encodedData] = transaction_uuid_raw.split('?data=');
            transaction_uuid = cleanUuid;

            try {
                const decodedData = Buffer.from(encodedData, 'base64').toString('utf8');
                const paymentData = JSON.parse(decodedData);
                console.log("[Payment Failure] Decoded transaction UUID:", transaction_uuid);
            } catch (decodeError) {
                console.error("[Payment Failure] Failed to decode embedded data:", decodeError.message);
                transaction_uuid = cleanUuid; // Still use the cleaned UUID
            }
        }
        // Case 2: Data is in separate 'data' query parameter
        else if (req.query.data) {
            console.log(" Detected separate data parameter");
            transaction_uuid = transaction_uuid_raw;

            try {
                const decodedData = Buffer.from(req.query.data, 'base64').toString('utf8');
                const paymentData = JSON.parse(decodedData);
                transaction_uuid = paymentData.transaction_uuid || transaction_uuid;
                console.log("[Payment Failure] Decoded transaction UUID:", transaction_uuid);
            } catch (decodeError) {
                console.error("[Payment Failure] Failed to decode data:", decodeError.message);
            }
        }
        // Case 3: Use raw transaction UUID
        else {
            transaction_uuid = transaction_uuid_raw;
        }

        console.log("[Payment Failure] Final transaction UUID:", transaction_uuid);

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

        // Add driverId to each order for socket communication
        const ordersWithDriver = orders.map(order => ({
            ...order.toObject(),
            driverId: req.userId  // Include driver ID for socket emit
        }))

        console.log(`Fetched ${ordersWithDriver.length} assigned orders for driver ${req.userId}`)
        res.json({ success: true, data: ordersWithDriver })
    } catch (error) {
        console.log(error)
        res.json({ success: false, message: "Error fetching assigned orders" })
    }
}

// INITIATE ESEWA PAYMENT FOR ORDER - POST /api/payment/order/esewa/initiate
const initiateEsewaPaymentOrder = async (req, res) => {
    try {
        const { orderId, amount } = req.body

        // Validation
        if (!orderId || !amount) {
            return res.json({
                success: false,
                message: "Order ID and amount are required"
            })
        }

        if (amount <= 0) {
            return res.json({
                success: false,
                message: "Amount must be greater than 0"
            })
        }

        // Fetch order
        const order = await orderModel.findById(orderId)

        if (!order) {
            return res.json({
                success: false,
                message: "Order not found"
            })
        }

        // Validate order status - should not be already paid
        if (order.payment === true) {
            return res.json({
                success: false,
                message: "Order is already paid"
            })
        }

        // Create transaction ID for this payment
        const transactionId = `ORDER_${orderId}_${Date.now()}_${crypto.randomBytes(4).toString('hex')}`

        // Get eSewa config
        const esewaConfig = getEsewaConfig()
        const backendUrl = process.env.BACKEND_URL || "http://localhost:4000"

        // Prepare eSewa payload with required fields
        const taxAmount = "0"
        const serviceCharge = "0"
        const deliveryCharge = "0"
        const totalAmount = formatAmount(amount)

        const payload = {
            amount: formatAmount(amount),
            tax_amount: taxAmount,
            total_amount: totalAmount,
            transaction_uuid: transactionId,
            product_code: esewaConfig.productCode,
            product_name: "RestroMatrix Order Payment",
            product_service_charge: serviceCharge,
            product_delivery_charge: deliveryCharge,
            success_url: `${backendUrl}/api/payment/success?transaction_uuid=${encodeURIComponent(transactionId)}`,
            failure_url: `${backendUrl}/api/payment/failure?transaction_uuid=${encodeURIComponent(transactionId)}`,
            signed_field_names: "total_amount,transaction_uuid,product_code"
        }

        // Generate signature
        const signedFieldNames = payload.signed_field_names
        const signatureData = signedFieldNames
            .split(",")
            .map(field => {
                const value = payload[field]
                return `${field}=${value || ""}`
            })
            .join(",")

        console.log("Signature Data:", signatureData)
        console.log(" eSewa Payload:", payload)

        const signature = crypto
            .createHmac("sha256", esewaConfig.secretKey)
            .update(signatureData)
            .digest("base64")

        console.log("Generated Signature:", signature)

        // Update order with transaction ID for later verification
        order.esewaTransactionId = transactionId
        await order.save()

        // Return payment form data with all required fields
        return res.json({
            amount: payload.amount,
            tax_amount: payload.tax_amount,
            total_amount: payload.total_amount,
            transaction_uuid: payload.transaction_uuid,
            product_code: payload.product_code,
            product_name: payload.product_name,
            product_service_charge: payload.product_service_charge,
            product_delivery_charge: payload.product_delivery_charge,
            success_url: payload.success_url,
            failure_url: payload.failure_url,
            signed_field_names: payload.signed_field_names,
            signature,
            paymentEndpoint: esewaConfig.endpoint
        })
    } catch (error) {
        console.error("Error initiating eSewa payment:", error)
        return res.json({
            success: false,
            message: "Error initiating payment",
            error: error.message
        })
    }
}

export { placeOrder, verifyOrder, userOrders, listOrders, updateOrderStatus, getOrderById, getDriverAssignedOrders, paymentSuccess, paymentFailure, initiateEsewaPaymentOrder }