import mongoose from 'mongoose';

const billSchema = new mongoose.Schema({
    tableNumber: {
        type: Number,
        required: true,
        validate: {
            validator: function (v) {
                return v > 0;
            },
            message: 'Table number must be positive'
        }
    },

    totalAmount: {
        type: Number,
        required: true,
        validate: {
            validator: function (v) {
                return v > 0;
            },
            message: 'Total amount must be greater than 0'
        }
    },

    paidAmount: {
        type: Number,
        default: 0,
        validate: {
            validator: function (v) {
                return v >= 0 && v <= this.totalAmount;
            },
            message: 'Paid amount must be between 0 and total amount'
        }
    },

    remainingAmount: {
        type: Number,
        required: true
    },

    status: {
        type: String,
        enum: ['UNPAID', 'PAID'],
        default: 'UNPAID'
    },

    qrActive: {
        type: Boolean,
        default: true
    },

    qrCodeData: {
        type: String,
        unique: true,
        sparse: true
    },

    notes: {
        type: String,
        default: null
    }

}, { timestamps: true });


// ✅ Pre-save middleware
billSchema.pre('save', function () {

    this.remainingAmount = this.totalAmount - this.paidAmount;

    // Auto update status
    if (this.paidAmount >= this.totalAmount) {
        this.status = 'PAID';
        this.qrActive = false;
    } else {
        this.status = 'UNPAID';
        this.qrActive = true;
    }

});

const billModel = mongoose.models.Bill || mongoose.model('Bill', billSchema);

export default billModel;
