import driverModel from "../models/driverModel.js";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import validator from "validator";

const createToken = (id) => {
    if (!process.env.JWT_SECRET) {
        throw new Error("JWT_SECRET is not defined in environment variables");
    }
    return jwt.sign({ id }, process.env.JWT_SECRET);
};

/* ---------------- DRIVER LOGIN ---------------- */

const loginDriver = async (req, res) => {
    try {

        const { email, password } = req.body;

        if (!email || !password) {
            return res.json({
                success: false,
                message: "Email and password required"
            });
        }

        const driver = await driverModel.findOne({ email });

        if (!driver) {
            return res.json({
                success: false,
                message: "Driver does not exist"
            });
        }

        const isMatch = await bcrypt.compare(password, driver.password);

        if (!isMatch) {
            return res.json({
                success: false,
                message: "Invalid credentials"
            });
        }

        const token = createToken(driver._id);

        res.json({
            success: true,
            token,
            role: driver.role,
            data: driver
        });

    } catch (error) {
        console.log(error);
        res.json({
            success: false,
            message: "Server error"
        });
    }
};

/* ---------------- DRIVER REGISTER ---------------- */

const registerDriver = async (req, res) => {
    try {


        const { name, email, password, phone, vehicle, vehicleNumber, restaurantId } = req.body;

        if (!restaurantId) {
            return res.json({
                success: false,
                message: "restaurantId is required"
            });
        }

        if (!name || !email || !password || !phone || !vehicle || !vehicleNumber) {
            return res.json({
                success: false,
                message: "All driver fields are required"
            });
        }

        const exist = await driverModel.findOne({ email });

        if (exist) {
            return res.json({
                success: false,
                message: "Driver already exists"
            });
        }

        if (!validator.isEmail(email)) {
            return res.json({
                success: false,
                message: "Enter valid email"
            });
        }

        if (password.length < 8) {
            return res.json({
                success: false,
                message: "Password must be at least 8 characters"
            });
        }

        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(password, salt);

        const newDriver = new driverModel({
            name,
            email,
            password: hashedPassword,
            phone,
            vehicle,
            vehicleNumber,
            restaurantId
        });

        const driver = await newDriver.save();

        const token = createToken(driver._id);

        res.json({
            success: true,
            token,
            role: driver.role,
            data: driver
        });

    } catch (error) {
        console.log(error);
        res.json({
            success: false,
            message: "Server error"
        });
    }
};

/* ---------------- GET ALL DRIVERS ---------------- */

const getAllDrivers = async (req, res) => {
    try {

        const drivers = await driverModel.find().select("-password");

        res.json({
            success: true,
            data: drivers
        });

    } catch (error) {

        console.log(error);

        res.json({
            success: false,
            message: "Error fetching drivers"
        });

    }
};

/* ---------------- GET DRIVER BY ID ---------------- */

const getDriverById = async (req, res) => {
    try {

        const { id } = req.params;

        const driver = await driverModel
            .findById(id)
            .select("-password");

        if (!driver) {
            return res.json({
                success: false,
                message: "Driver not found"
            });
        }

        res.json({
            success: true,
            data: driver
        });

    } catch (error) {

        console.log(error);

        res.json({
            success: false,
            message: "Error fetching driver"
        });

    }
};

/* ---------------- UPDATE DRIVER ---------------- */

const updateDriver = async (req, res) => {
    try {

        const { id } = req.params;

        const { name, phone, vehicle, vehicleNumber, isOnline } = req.body;

        const driver = await driverModel
            .findByIdAndUpdate(
                id,
                {
                    name,
                    phone,
                    vehicle,
                    vehicleNumber,
                    isOnline,
                    updatedAt: Date.now()
                },
                { new: true }
            )
            .select("-password");

        if (!driver) {
            return res.json({
                success: false,
                message: "Driver not found"
            });
        }

        res.json({
            success: true,
            data: driver
        });

    } catch (error) {

        console.log(error);

        res.json({
            success: false,
            message: "Error updating driver"
        });

    }
};

/* ---------------- UPDATE DRIVER LOCATION ---------------- */

const updateDriverLocation = async (req, res) => {
    try {

        const { id } = req.params;
        const driverId = id || req.userId;  //  Get ID from params or token
        const { latitude, longitude } = req.body;

        console.log(" Location update request:", {
            driverId,
            latitude,
            longitude,
            fromParams: !!id,
            fromToken: !!req.userId
        });

        if (!latitude || !longitude) {
            return res.json({
                success: false,
                message: "Latitude and longitude required"
            });
        }

        if (!driverId) {
            return res.json({
                success: false,
                message: "Driver ID not found"
            });
        }

        const driver = await driverModel
            .findByIdAndUpdate(
                driverId,
                {
                    location: {
                        latitude,
                        longitude
                    },
                    updatedAt: Date.now()
                },
                { new: true }
            )
            .select("-password");

        if (!driver) {
            return res.json({
                success: false,
                message: "Driver not found"
            });
        }

        console.log("Driver location updated:", {
            driverId: driver._id,
            lat: driver.location.latitude,
            lng: driver.location.longitude
        });

        res.json({
            success: true,
            data: driver
        });

    } catch (error) {

        console.error(" Location update error:", error);

        res.json({
            success: false,
            message: "Error updating location"
        });

    }
};

/* ---------------- DELETE DRIVER ---------------- */

const deleteDriver = async (req, res) => {
    try {

        const { id } = req.params;

        const driver = await driverModel.findByIdAndDelete(id);

        if (!driver) {
            return res.json({
                success: false,
                message: "Driver not found"
            });
        }

        res.json({
            success: true,
            message: "Driver deleted successfully"
        });

    } catch (error) {

        console.log(error);

        res.json({
            success: false,
            message: "Error deleting driver"
        });

    }
};

export {
    loginDriver,
    registerDriver,
    getAllDrivers,
    getDriverById,
    updateDriver,
    updateDriverLocation,
    deleteDriver
};