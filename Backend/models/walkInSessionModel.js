import mongoose from "mongoose";

const walkInSessionSchema = new mongoose.Schema(
    {
        // Unique identifier for the walk-in session (QR-based)
        sessionId: {
            type: String,
            required: true,
            unique: true,
        },
        tableNumber: {
            type: String,
            required: true,
        },
        restaurantId: {
            type: String,
        },
        // Array of items ordered at this table
        items: [
            {
                foodId: {
                    type: mongoose.Schema.Types.ObjectId,
                    ref: "food",
                },
                name: String,
                price: Number,
                quantity: Number,
            },
        ],
        // Total bill for the table
        totalBillAmount: {
            type: Number,
            required: true,
            default: 0,
        },
        // Track payments made toward the bill
        payments: [
            {
                paymentId: String,
                transactionUuid: String, // Unique per payment (prevents duplicate transactions)
                amountPaid: Number,
                status: {
                    type: String,
                    enum: ["pending", "success", "failed"],
                    default: "pending",
                },
                esewaRefId: String, // eSewa reference ID from payment
                createdAt: {
                    type: Date,
                    default: Date.now,
                },
            },
        ],
        // Total amount that has been successfully paid
        totalPaidAmount: {
            type: Number,
            default: 0,
        },
        // Session status
        status: {
            type: String,
            enum: ["active", "awaiting_payment", "fully_paid", "closed"],
            default: "active",
        },
        createdAt: {
            type: Date,
            default: Date.now,
        },
        updatedAt: {
            type: Date,
            default: Date.now,
        },
    }
);

const walkInSessionModel =
    mongoose.models.walkinSession ||
    mongoose.model("walkinSession", walkInSessionSchema);

export default walkInSessionModel;
