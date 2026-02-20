import mongoose from "mongoose";

const orderSchema = new mongoose.Schema({
    tableNumber: { type: String, required: true },
    items: { type: Array, required: true },
    amount: { type: Number, required: true },
    status: { type: String, default: "Food Processing" },
    date: { type: Date, default: Date.now },
    payment: { type: Boolean, default: false },
    source: { type: String, default: "qr" }
});

const orderModel = mongoose.models.order || mongoose.model("order", orderSchema);

export default orderModel;
