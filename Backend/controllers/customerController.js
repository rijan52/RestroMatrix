import customerModel from "../models/customerModel.js";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import validator from "validator";

const createToken = (id, restaurantId) => {
    return jwt.sign({ id, restaurantId }, process.env.JWT_SECRET);
};

// Customer Login (FIXED for SaaS)
const loginCustomer = async (req, res) => {
    const { email, password } = req.body;
    const { restaurantId } = req.params; 

    try {
        const customer = await customerModel.findOne({ email, restaurantId });
        if (!customer) {
            return res.json({ success: false, message: "Customer does not exist" });
        }

        const isMatch = await bcrypt.compare(password, customer.password);
        if (!isMatch) {
            return res.json({ success: false, message: "Invalid credentials" });
        }

        const token = createToken(customer._id, restaurantId);

        return res.json({
            success: true,
            data: customer,
            token,
            role: customer.role
        });

    } catch (error) {
        console.log(error);
        return res.json({ success: false, message: "Error" });
    }
};

// Customer Register (FIXED for SaaS)
const registerCustomer = async (req, res) => {
    const { name, email, password, phone } = req.body;
    const { restaurantId } = req.params; // 👈 NEVER from frontend body

    try {
        // Check per restaurant
        const exist = await customerModel.findOne({ email, restaurantId });
        if (exist) {
            return res.json({ success: false, message: "Customer already exists" });
        }

        if (!validator.isEmail(email)) {
            return res.json({ success: false, message: "Please Enter Valid Email" });
        }

        if (password.length < 8) {
            return res.json({ success: false, message: "Password not strong enough" });
        }

        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(password, salt);

        const newCustomer = new customerModel({
            name,
            email,
            password: hashedPassword,
            phone: phone || null,
            role: "customer",
            restaurantId // always from backend
        });

        const customer = await newCustomer.save();
        const token = createToken(customer._id, restaurantId);

        res.json({
            success: true,
            data: customer,
            token,
            role: customer.role
        });

    } catch (error) {
        console.log(error);
        res.json({ success: false, message: "Error" });
    }
};

// Get all customers (FILTERED)
const getAllCustomers = async (req, res) => {
    try {
        const { restaurantId } = req.user; // from auth middleware

        const customers = await customerModel
            .find({ restaurantId })
            .select("-password");

        res.json({ success: true, data: customers });

    } catch (error) {
        console.log(error);
        res.json({ success: false, message: "Error fetching customers" });
    }
};

// Get by ID (SECURE)
const getCustomerById = async (req, res) => {
    try {
        const { id } = req.params;
        const { restaurantId } = req.user;

        const customer = await customerModel
            .findOne({ _id: id, restaurantId })
            .select("-password");

        if (!customer) {
            return res.json({ success: false, message: "Customer not found" });
        }

        res.json({ success: true, data: customer });

    } catch (error) {
        console.log(error);
        res.json({ success: false, message: "Error fetching customer" });
    }
};

// Update (SECURE)
const updateCustomer = async (req, res) => {
    try {
        const { id } = req.params;
        const { restaurantId } = req.user;
        const { name, phone, address } = req.body;

        const customer = await customerModel.findOneAndUpdate(
            { _id: id, restaurantId }, // 🔥 important
            { name, phone, address },
            { new: true }
        ).select("-password");

        if (!customer) {
            return res.json({ success: false, message: "Customer not found" });
        }

        res.json({ success: true, data: customer });

    } catch (error) {
        console.log(error);
        res.json({ success: false, message: "Error updating customer" });
    }
};

// ✅ Delete (SECURE)
const deleteCustomer = async (req, res) => {
    try {
        const { id } = req.params;
        const { restaurantId } = req.user;

        const customer = await customerModel.findOneAndDelete({
            _id: id,
            restaurantId
        });

        if (!customer) {
            return res.json({ success: false, message: "Customer not found" });
        }

        res.json({ success: true, message: "Customer deleted successfully" });

    } catch (error) {
        console.log(error);
        res.json({ success: false, message: "Error deleting customer" });
    }
};

export {
    loginCustomer,
    registerCustomer,
    getAllCustomers,
    getCustomerById,
    updateCustomer,
    deleteCustomer
};