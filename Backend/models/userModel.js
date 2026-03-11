import mongoose from 'mongoose';

const userSchema = new mongoose.Schema({
    name: { type: String, required: true },
    email: { type: String, required: true, unique: true },
    password: { type: String, required: true },
    role: { type: String, default: 'customer', enum: ['customer', 'driver'] },
    cartData: { type: Object, default: {} },
    driverPhone: { type: String, default: null },
    driverVehicle: { type: String, default: null },
    driverRating: { type: Number, default: 0 },
    isOnline: { type: Boolean, default: false },
}, { minimize: false })

const userModel = mongoose.models.users || mongoose.model('users', userSchema);

export default userModel;