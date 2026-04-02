import mongoose from 'mongoose';

const paymentSchema = new mongoose.Schema({
    billId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Bill',
        required: true
    },
    restaurantId: {
        type: String,
        required: true
    },
    amount: {
        type: Number,
        required: true,
        validate: {
            validator: function (v) {
                return v > 0;
            },
            message: 'Amount must be greater than 0'
        }
    },
    method: {
        type: String,
        enum: ['esewa', 'cash', 'card'],
        default: 'esewa'
    },
    transactionId: {
        type: String,
        unique: true,
        sparse: true
    },
    status: {
        type: String,
        enum: ['PENDING', 'SUCCESS', 'FAILED'],
        default: 'PENDING'
    },
    esewaDetails: {
        productCode: String,
        productName: String,
        esewaTransactionId: String,
        refId: String,
        failureCode: String,
        failureMessage: String
    },
    customerPhone: {
        type: String,
        default: null
    },
    customerName: {
        type: String,
        default: null
    },
    paidAt: {
        type: Date,
        default: null
    },
    failedAt: {
        type: Date,
        default: null
    },
    failureReason: {
        type: String,
        default: null
    },
    createdAt: {
        type: Date,
        default: Date.now
    },
    updatedAt: {
        type: Date,
        default: Date.now
    }
}, { timestamps: true });

// Index for quick lookups
paymentSchema.index({ billId: 1 });
paymentSchema.index({ restaurantId: 1 });
paymentSchema.index({ status: 1 });
paymentSchema.index({ createdAt: -1 });

const paymentModel = mongoose.models.Payment || mongoose.model('Payment', paymentSchema);

export default paymentModel;
