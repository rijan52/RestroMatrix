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
        password: {
            type: String,
            trim: true,
            default: "",
        },
        headerTitle: {
            type: String,
            trim: true,
            default: "",
        },
        headerContent: {
            type: String,
            trim: true,
            default: "",
        },
        headerButtonText: {
            type: String,
            trim: true,
            default: "",
        },
        headerBackgroundImage: {
            type: String,
            default: "",
        },
        exploreMenuTitle: {
            type: String,
            trim: true,
            default: "",
        },
        exploreMenuDescription: {
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
