import userModel from "../models/userModel.js";
import bcrypt from "bcryptjs"
import jwt from "jsonwebtoken"
import validator from "validator"

// login user
const loginUser = async (req, res) => {
    const { email, password } = req.body;

    try {
        const user = await userModel.findOne({ email });
        if (!user) {
            return res.json({ success: false, message: "User does not exist" });
        }

        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) {
            return res.json({ success: false, message: "Invalid credentials" });
        }

        const token = createToken(user._id);
        return res.json({ success: true, data: user, token, role: user.role });
    } catch (error) {
        console.log(error);
        return res.json({ success: false, message: "Error" });
    }
}

const createToken = (id) => {
    return jwt.sign({ id }, process.env.JWT_SECRET)
}

// Get all drivers
const getDrivers = async (req, res) => {
    try {
        const drivers = await userModel.find({ role: "driver" }).select("-password");
        res.json({ success: true, data: drivers });
    } catch (error) {
        console.log(error);
        res.json({ success: false, message: "Error fetching drivers" });
    }
}

// Delete driver
const deleteDriver = async (req, res) => {
    try {
        const { id } = req.params;
        const driver = await userModel.findByIdAndDelete(id);
        if (!driver) {
            return res.json({ success: false, message: "Driver not found" });
        }
        res.json({ success: true, message: "Driver deleted successfully" });
    } catch (error) {
        console.log(error);
        res.json({ success: false, message: "Error deleting driver" });
    }
}

//  register user
const registerUser = async (req, res) => {
    const { name, email, password, role = "customer", driverPhone, driverVehicle } = req.body;
    try {

        // checking is user already exists
        const exist = await userModel.findOne({ email });
        if (exist) {
            return res.json({ success: false, message: "User already exists" })
        }
        // validate email & strong pass word
        if (!validator.isEmail(email)) {
            return res.json({ success: false, message: "Please Enter Valid Email" })
        }
        if (password.length < 8) {
            return res.json({ success: false, message: "Password not strong enough" })
        }
        // hash password
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(password, salt);

        const newUser = new userModel({
            name: name,
            email: email,
            password: hashedPassword,
            role: role,
            driverPhone: role === "driver" ? driverPhone : null,
            driverVehicle: role === "driver" ? driverVehicle : null
        })

        const user = await newUser.save()
        const token = createToken(user._id)
        res.json({ success: true, data: user, token, role: user.role });
    } catch (error) {
        console.log(error);
        res.json({ success: false, message: "Error" })


    }
}

export { loginUser, registerUser, getDrivers, deleteDriver };