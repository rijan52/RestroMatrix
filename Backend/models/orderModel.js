import mongoose from "mongoose"

const orderSchema = new mongoose.Schema({
    userId: { type: String, required: true },
    restaurantId: { type: String, required: true }, // Added for multi-tenant support
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
    payment: { type: Boolean, default: false },
    paymentStatus: { type: String, default: "Pending" }, // Added: Pending, Completed, Failed
    esewaTransactionId: { type: String, default: null }, // Added: to store eSewa transaction UUID
    esewaTransactionCode: { type: String, default: null }, // Added: to store eSewa transaction code
    transactionId: { type: String, default: null } // Custom order/transaction code (ORDER_...)
})

const orderModel = mongoose.models.order || mongoose.model("order", orderSchema);

export default orderModel;