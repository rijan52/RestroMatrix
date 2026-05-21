import mongoose from "mongoose";

const driverSchema = new mongoose.Schema(
    {
        name: {
            type: String,
            required: true,
            trim: true
        },

        email: {
            type: String,
            required: true,
            unique: true,
            lowercase: true,
            trim: true
        },

        password: {
            type: String,
            required: true
        },

        role: {
            type: String,
            default: "driver",
            enum: ["driver"]
        },

        phone: {
            type: String,
            required: true,
            trim: true
        },

        vehicle: {
            type: String,
            required: true
        },

        vehicleNumber: {
            type: String,
            required: true,
            trim: true
        },

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
        }
    },
    {
        timestamps: true,
        minimize: false
    }
);

const driverModel =
    mongoose.models.drivers ||
    mongoose.model("drivers", driverSchema);

export default driverModel;