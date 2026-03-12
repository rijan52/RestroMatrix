import customerModel from "../models/customerModel.js";
import bcrypt from "bcryptjs"
import jwt from "jsonwebtoken"
import validator from "validator"

const createToken = (id) => {
    return jwt.sign({ id }, process.env.JWT_SECRET)
}

// Customer Login
const loginCustomer = async (req, res) => {
    const { email, password } = req.body;

    try {
        const customer = await customerModel.findOne({ email });
        if (!customer) {
            return res.json({ success: false, message: "Customer does not exist" });
        }

        const isMatch = await bcrypt.compare(password, customer.password);
        if (!isMatch) {
            return res.json({ success: false, message: "Invalid credentials" });
        }

        const token = createToken(customer._id);
        return res.json({ success: true, data: customer, token, role: customer.role });
    } catch (error) {
        console.log(error);
        return res.json({ success: false, message: "Error" });
    }
}

// Customer Register
const registerCustomer = async (req, res) => {
    const { name, email, password, phone } = req.body;
    try {

        // Checking if customer already exists
        const exist = await customerModel.findOne({ email });
        if (exist) {
            return res.json({ success: false, message: "Customer already exists" })
        }

        // Validate email & strong password
        if (!validator.isEmail(email)) {
            return res.json({ success: false, message: "Please Enter Valid Email" })
        }
        if (password.length < 8) {
            return res.json({ success: false, message: "Password not strong enough" })
        }

        // Hash password
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(password, salt);

        const newCustomer = new customerModel({
            name: name,
            email: email,
            password: hashedPassword,
            phone: phone || null,
            role: "customer"
        })

        const customer = await newCustomer.save()
        const token = createToken(customer._id)
        res.json({ success: true, data: customer, token, role: customer.role });
    } catch (error) {
        console.log(error);
        res.json({ success: false, message: "Error" })
    }
}

// Get all customers
const getAllCustomers = async (req, res) => {
    try {
        const customers = await customerModel.find().select("-password");
        res.json({ success: true, data: customers });
    } catch (error) {
        console.log(error);
        res.json({ success: false, message: "Error fetching customers" });
    }
}

// Get customer by ID
const getCustomerById = async (req, res) => {
    try {
        const { id } = req.params;
        const customer = await customerModel.findById(id).select("-password");
        if (!customer) {
            return res.json({ success: false, message: "Customer not found" });
        }
        res.json({ success: true, data: customer });
    } catch (error) {
        console.log(error);
        res.json({ success: false, message: "Error fetching customer" });
    }
}

// Update customer
const updateCustomer = async (req, res) => {
    try {
        const { id } = req.params;
        const { name, phone, address } = req.body;

        const customer = await customerModel.findByIdAndUpdate(
            id,
            {
                name,
                phone,
                address,
                updatedAt: Date.now()
            },
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
}

// Delete customer
const deleteCustomer = async (req, res) => {
    try {
        const { id } = req.params;
        const customer = await customerModel.findByIdAndDelete(id);
        if (!customer) {
            return res.json({ success: false, message: "Customer not found" });
        }
        res.json({ success: true, message: "Customer deleted successfully" });
    } catch (error) {
        console.log(error);
        res.json({ success: false, message: "Error deleting customer" });
    }
}

export { loginCustomer, registerCustomer, getAllCustomers, getCustomerById, updateCustomer, deleteCustomer };