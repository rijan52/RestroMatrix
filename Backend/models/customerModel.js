import mongoose from 'mongoose';

const customerSchema = new mongoose.Schema({
    name: { type: String, required: true },
    email: { type: String, required: true, unique: true },
    password: { type: String, required: true },
    role: { type: String, default: 'customer', enum: ['customer'] },
    phone: { type: String, default: null },
    cartData: { type: Object, default: {} },
    address: { type: String, default: null },
    location: {
        latitude: {
            type: Number,
            default: null
        },
        longitude: {
            type: Number,
            default: null
        }
    },
     restaurantId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'restaurantprofile',
        required: true
      },
    createdAt: { type: Date, default: Date.now },
    updatedAt: { type: Date, default: Date.now }
}, { minimize: false })

const customerModel = mongoose.models.customers || mongoose.model('customers', customerSchema);

export default customerModel;