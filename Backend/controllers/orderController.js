import orderModel from "../models/orderModel.js";
import userModel from "../models/userModel.js";
import Stripe from "stripe";


const stripe = new Stripe(process.env.STRIPE_SECRET_KEY)

//placing user order for frontend

const placeOrder = async (req, res) => {

    const frontend_url = "http://localhost:5173";
    try {
        if (!process.env.STRIPE_SECRET_KEY) {
            return res.json({ success: false, message: "Stripe key missing" })
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

        const line_items = req.body.items.map((items) => ({
            price_data: {
                currency: "inr",
                product_data: {
                    name: items.name
                },
                unit_amount: Math.round(Number(items.price) * 100)
            },
            quantity: items.quantity
        }))
        line_items.push({
            price_data: {
                currency: "inr",
                product_data: {
                    name: "Delivery Charges"
                },
                unit_amount: 2 * 100
            },
            quantity: 1

        })
        const session = await stripe.checkout.sessions.create({
            line_items: line_items,
            mode: "payment",
            success_url: `${frontend_url}/verify?success=true&orderId=${newOrder._id}`,
            cancel_url: `${frontend_url}/verify?success=false&orderId=${newOrder._id}`,

        })
        res.json({ success: true, session_url: session.url })



    } catch (error) {
        console.log(error);
        res.json({ success: false, message: error?.message || "Error" })

    }

}

const verifyOrder = async (req, res) => {
    const { orderId, success } = req.body;
    try {
        if (success == "true") {
            await orderModel.findByIdAndUpdate(orderId, { payment: true });
            res.json({ success: true, message: "Paid" })
        }
        else {
            await orderModel.findByIdAndDelete(orderId);
            res.json({ success: false, message: "Not paid" })
        }
    } catch (error) {
        console.log(error);
        res.json({ success: false, message: "Error" })
    }
}

// user orders for frontend

const userOrders = async (req, res) => {
    try {
        const orders = await orderModel.find({ userId: req.body.userId });
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
        const orders = await orderModel.find({});
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
        const result = await orderModel.findByIdAndUpdate(req.body.orderId, { status: req.body.status })
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

export { placeOrder, verifyOrder, userOrders, listOrders, updateOrderStatus }