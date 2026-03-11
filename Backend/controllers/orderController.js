import crypto from "crypto";
import orderModel from "../models/orderModel.js";
import userModel from "../models/userModel.js";

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
        productCode: process.env.ESEWA_PRODUCT_CODE,
        secretKey: process.env.ESEWA_SECRET_KEY
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

    const frontend_url = "http://localhost:5173";
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
        await userModel.findByIdAndUpdate(req.userId, { cartData: {} })

        const deliveryFeeNpr = 2
        const totals = calculateOrderTotals(req.body.items, deliveryFeeNpr)

        if (totals.totalAmount < MIN_CHARGE_NPR) {
            return res.json({
                success: false,
                message: `Minimum order amount is Rs ${MIN_CHARGE_NPR}. Please add more items.`
            })
        }

        const paymentPayload = {
            amount: formatAmount(totals.itemsTotal),
            tax_amount: formatAmount(0),
            total_amount: formatAmount(totals.totalAmount),
            transaction_uuid: String(newOrder._id),
            product_code: esewaConfig.productCode,
            product_service_charge: formatAmount(0),
            product_delivery_charge: formatAmount(totals.deliveryFee),
            success_url: `${frontend_url}/verify`,
            failure_url: `${frontend_url}/verify`,
            signed_field_names: "total_amount,transaction_uuid,product_code"
        }

        const signature = signEsewaPayload(
            {
                total_amount: paymentPayload.total_amount,
                transaction_uuid: paymentPayload.transaction_uuid,
                product_code: paymentPayload.product_code
            },
            esewaConfig.secretKey
        )

        res.json({
            success: true,
            payment: {
                endpoint: esewaConfig.endpoint,
                params: {
                    ...paymentPayload,
                    signature
                }
            }
        })



    } catch (error) {
        console.log(error);
        res.json({ success: false, message: error?.message || "Error" })

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

            // Fetch driver details from user model
            try {
                const driver = await userModel.findOne({
                    name: req.body.driverName,
                    role: 'driver'
                })

                if (driver) {
                    updateData.driverPhone = driver.driverPhone
                    updateData.driverVehicle = driver.driverVehicle
                    updateData.driverRating = driver.driverRating || 0
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
        // Get driver's name from user model
        const driver = await userModel.findById(req.userId)

        if (!driver) {
            return res.json({ success: false, message: "Driver not found" })
        }

        // Find orders assigned to this driver
        const orders = await orderModel.find({
            driverName: driver.name,
            status: { $in: ["Confirmed", "Out for delivery"] }
        }).sort({ date: -1 })

        res.json({ success: true, data: orders })
    } catch (error) {
        console.log(error)
        res.json({ success: false, message: "Error fetching assigned orders" })
    }
}

export { placeOrder, verifyOrder, userOrders, listOrders, updateOrderStatus, getOrderById, getDriverAssignedOrders }