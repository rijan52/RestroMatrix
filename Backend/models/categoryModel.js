import mongoose from "mongoose";

const categorySchema = new mongoose.Schema({
    name: {
        type: String,
        required: true,
        unique: true,
        trim: true
    },
    image: {
        type: String,
        required: true
    },
    description: {
        type: String,
        trim: true
    },
    restaurantId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'restaurantprofile',
        required: true
    },
    createdAt: {
        type: Date,
        default: Date.now
    }
});

const categoryModel = mongoose.models.category || mongoose.model("category", categorySchema);

export default categoryModel;
