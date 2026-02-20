import orderModel from "../models/orderModel.js";

export const createOrder = async (req, res) => {
    try {
        const { tableNumber, items, amount } = req.body;
        if (!tableNumber) {
            return res.json({ success: false, message: "Table number is required" });
        }
        if (!Array.isArray(items) || items.length === 0) {
            return res.json({ success: false, message: "Items are required" });
        }
        if (typeof amount !== "number") {
            return res.json({ success: false, message: "Amount is required" });
        }
        const newOrder = new orderModel({
            tableNumber,
            items,
            amount
        });
        await newOrder.save();
        res.json({ success: true, orderId: newOrder._id });
    } catch (error) {
        console.log(error);
        res.json({ success: false, message: "Unable to create order" });
    }
};

export const getOrderStatus = async (req, res) => {
    try {
        const { orderId } = req.params;
        const order = await orderModel.findById(orderId);
        if (!order) {
            return res.status(404).json({ success: false, message: "Order not found" });
        }
        res.json({ success: true, status: order.status, orderId: order._id });
    } catch (error) {
        console.log(error);
        res.json({ success: false, message: "Unable to fetch status" });
    }
};
