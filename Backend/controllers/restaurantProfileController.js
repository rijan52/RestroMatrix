import fs from "fs";
import restaurantProfileModel from "../models/restaurantProfileModel.js";

const getRestaurantProfile = async (req, res) => {
    try {
        const profile = await restaurantProfileModel.findOne({});

        if (!profile) {
            return res.json({
                success: true,
                data: {
                    restaurantName: "",
                    logo: "",
                    email: "",
                    phoneNumber: "",
                    address: "",
                    description: "",
                    openingHours: "",
                },
            });
        }

        res.json({ success: true, data: profile });
    } catch (error) {
        console.log(error);
        res.json({ success: false, message: "Error fetching restaurant profile" });
    }
};

const updateRestaurantProfile = async (req, res) => {
    try {
        let profile = await restaurantProfileModel.findOne({});

        if (!profile) {
            profile = new restaurantProfileModel();
        }

        profile.restaurantName = req.body.restaurantName || "";
        profile.email = req.body.email || "";
        profile.phoneNumber = req.body.phoneNumber || "";
        profile.address = req.body.address || "";
        profile.description = req.body.description || "";
        profile.openingHours = req.body.openingHours || "";

        if (req.file) {
            if (profile.logo) {
                const oldLogoPath = `uploads/${profile.logo}`;
                if (fs.existsSync(oldLogoPath)) {
                    fs.unlink(oldLogoPath, (err) => {
                        if (err) {
                            console.log("Error deleting old logo:", err);
                        }
                    });
                }
            }

            profile.logo = `${req.file.filename}`;
        }

        await profile.save();

        res.json({
            success: true,
            message: "Restaurant profile updated successfully",
            data: profile,
        });
    } catch (error) {
        console.log(error);
        res.json({ success: false, message: "Error updating restaurant profile" });
    }
};

export { getRestaurantProfile, updateRestaurantProfile };
