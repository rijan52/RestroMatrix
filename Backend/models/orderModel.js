import mongoose from "mongoose"

const orderSchema = new mongoose.Schema({
    userId: { type: String, required: true },
    items: { type: Array, required: true },
    amount: { type: Number, required: true },
    address: { type: Object, required: true },
    status: { type: String, default: "Food Processing" },
    driverName: { type: String, default: null },
    driverPhone: { type: String, default: null },
    driverId: { type: String, default: null },
    driverVehicle: { type: String, default: null },
    driverRating: { type: Number, default: 0 },
    driverLocation: {
        latitude: {
            type: Number,
            default: null
        },
        longitude: {
            type: Number,
            default: null
        }
    },
    customerLocation: {
        latitude: {
            type: Number,
            default: null
        },
        longitude: {
            type: Number,
            default: null
        }
    },
    date: { type: Date, default: Date.now() },
    payment: { type: Boolean, default: false }
})

const orderModel = mongoose.models.order || mongoose.model("order", orderSchema);

export default orderModel;