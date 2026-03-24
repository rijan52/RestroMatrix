import mongoose from "mongoose";

const restaurantProfileSchema = new mongoose.Schema(
    {
        restaurantName: {
            type: String,
            trim: true,
            default: "",
        },
        logo: {
            type: String,
            default: "",
        },
        email: {
            type: String,
            trim: true,
            default: "",
        },
        phoneNumber: {
            type: String,
            trim: true,
            default: "",
        },
        address: {
            type: String,
            trim: true,
            default: "",
        },
        description: {
            type: String,
            trim: true,
            default: "",
        },
        openingHours: {
            type: String,
            trim: true,
            default: "",
        },
    },
    { timestamps: true }
);

const restaurantProfileModel =
    mongoose.models.restaurantprofile ||
    mongoose.model("restaurantprofile", restaurantProfileSchema);

export default restaurantProfileModel;
