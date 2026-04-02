
import restaurantProfileModel from '../models/restaurantProfileModel.js';
import bcrypt from 'bcryptjs';
import mongoose from 'mongoose';
import fs from 'fs';

const sanitizeProfile = (profile) => {
    const safeProfile = profile.toObject();
    delete safeProfile.password;
    return safeProfile;
};

// Get restaurant profile by ID
const getRestaurantProfileById = async (req, res) => {
    try {
        const { id } = req.params;
        const profile = await restaurantProfileModel.findById(id);
        if (!profile) {
            return res.status(404).json({ success: false, message: 'Restaurant profile not found' });
        }

        res.json({ success: true, data: sanitizeProfile(profile) });
    } catch (error) {
        console.log(error);
        res.status(500).json({ success: false, message: 'Error fetching restaurant profile by ID' });
    }
};

// Register a new restaurant
const registerRestaurant = async (req, res) => {
    try {
        const { restaurantName, email, password, phoneNumber, address } = req.body;
        if (!restaurantName || !email || !password || !phoneNumber || !address) {
            return res.json({ success: false, message: 'All fields are required' });
        }

        const existing = await restaurantProfileModel.findOne({ email });
        if (existing) {
            return res.json({ success: false, message: 'Email already registered' });
        }

        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(password, salt);
        const newRestaurant = new restaurantProfileModel({
            restaurantName,
            email,
            password: hashedPassword,
            phoneNumber,
            address,
        });

        await newRestaurant.save();
        res.json({ success: true, message: 'Registration successful' });
    } catch (error) {
        console.log(error);
        res.json({ success: false, message: 'Registration error' });
    }
};

const getRestaurantProfile = async (req, res) => {
    try {
        const { restaurantId } = req.query;

        if (!restaurantId || !mongoose.Types.ObjectId.isValid(restaurantId)) {
            return res.status(400).json({ success: false, message: 'Valid restaurantId is required' });
        }

        const profile = await restaurantProfileModel.findById(restaurantId);

        if (!profile) {
            return res.json({
                success: true,
                data: {
                    restaurantName: '',
                    logo: '',
                    email: '',
                    phoneNumber: '',
                    address: '',
                    description: '',
                    openingHours: '',
                    headerTitle: '',
                    headerContent: '',
                    headerButtonText: '',
                    headerBackgroundImage: '',
                    exploreMenuTitle: '',
                    exploreMenuDescription: '',
                },
            });
        }

        res.json({ success: true, data: sanitizeProfile(profile) });
    } catch (error) {
        console.log(error);
        res.json({ success: false, message: 'Error fetching restaurant profile' });
    }
};

const updateRestaurantProfile = async (req, res) => {
    try {
        const { restaurantId } = req.body;

        if (!restaurantId || !mongoose.Types.ObjectId.isValid(restaurantId)) {
            return res.status(400).json({ success: false, message: 'Valid restaurantId is required' });
        }

        const profile = await restaurantProfileModel.findById(restaurantId);

        if (!profile) {
            return res.status(404).json({ success: false, message: 'Restaurant profile not found' });
        }

        if (Object.prototype.hasOwnProperty.call(req.body, 'restaurantName')) {
            profile.restaurantName = req.body.restaurantName || '';
        }
        if (Object.prototype.hasOwnProperty.call(req.body, 'email')) {
            profile.email = req.body.email || '';
        }
        if (Object.prototype.hasOwnProperty.call(req.body, 'phoneNumber')) {
            profile.phoneNumber = req.body.phoneNumber || '';
        }
        if (Object.prototype.hasOwnProperty.call(req.body, 'address')) {
            profile.address = req.body.address || '';
        }
        if (Object.prototype.hasOwnProperty.call(req.body, 'description')) {
            profile.description = req.body.description || '';
        }
        if (Object.prototype.hasOwnProperty.call(req.body, 'openingHours')) {
            profile.openingHours = req.body.openingHours || '';
        }
        if (Object.prototype.hasOwnProperty.call(req.body, 'password') && req.body.password?.trim()) {
            const salt = await bcrypt.genSalt(10);
            profile.password = await bcrypt.hash(req.body.password, salt);
        }
        if (Object.prototype.hasOwnProperty.call(req.body, 'headerTitle')) {
            profile.headerTitle = req.body.headerTitle || '';
        }
        if (Object.prototype.hasOwnProperty.call(req.body, 'headerContent')) {
            profile.headerContent = req.body.headerContent || '';
        }
        if (Object.prototype.hasOwnProperty.call(req.body, 'headerButtonText')) {
            profile.headerButtonText = req.body.headerButtonText || '';
        }
        if (Object.prototype.hasOwnProperty.call(req.body, 'exploreMenuTitle')) {
            profile.exploreMenuTitle = req.body.exploreMenuTitle || '';
        }
        if (Object.prototype.hasOwnProperty.call(req.body, 'exploreMenuDescription')) {
            profile.exploreMenuDescription = req.body.exploreMenuDescription || '';
        }

        const logoFile = req.files?.logo?.[0];
        const headerBackgroundFile = req.files?.headerBackgroundImage?.[0];

        if (logoFile) {
            if (profile.logo) {
                const oldLogoPath = `uploads/${profile.logo}`;
                if (fs.existsSync(oldLogoPath)) {
                    fs.unlink(oldLogoPath, (err) => {
                        if (err) {
                            console.log('Error deleting old logo:', err);
                        }
                    });
                }
            }

            profile.logo = `${logoFile.filename}`;
        }

        if (headerBackgroundFile) {
            if (profile.headerBackgroundImage) {
                const oldHeaderImagePath = `uploads/${profile.headerBackgroundImage}`;
                if (fs.existsSync(oldHeaderImagePath)) {
                    fs.unlink(oldHeaderImagePath, (err) => {
                        if (err) {
                            console.log('Error deleting old header background image:', err);
                        }
                    });
                }
            }

            profile.headerBackgroundImage = `${headerBackgroundFile.filename}`;
        }

        await profile.save();

        res.json({
            success: true,
            message: 'Restaurant profile updated successfully',
            data: sanitizeProfile(profile),
        });
    } catch (error) {
        console.log(error);
        res.json({ success: false, message: 'Error updating restaurant profile' });
    }
};

const loginRestaurant = async (req, res) => {
    try {
        const { email, password } = req.body;
        if (!email || !password) {
            return res.json({ success: false, message: 'Email and password are required' });
        }

        const profile = await restaurantProfileModel.findOne({ email });
        if (!profile) {
            return res.json({ success: false, message: 'No restaurant found with this email' });
        }

        const isMatch = await bcrypt.compare(password, profile.password);
        if (!isMatch) {
            return res.json({ success: false, message: 'Incorrect password' });
        }

        return res.json({ success: true, message: 'Login successful', restaurantId: profile._id });
    } catch (error) {
        console.log(error);
        res.json({ success: false, message: 'Login error' });
    }
};

export { getRestaurantProfile, updateRestaurantProfile, loginRestaurant, registerRestaurant, getRestaurantProfileById };
