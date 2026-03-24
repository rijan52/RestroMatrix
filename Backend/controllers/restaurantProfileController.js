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
                    headerTitle: "",
                    headerContent: "",
                    headerButtonText: "",
                    headerBackgroundImage: "",
                    exploreMenuTitle: "",
                    exploreMenuDescription: "",
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

        if (Object.prototype.hasOwnProperty.call(req.body, "restaurantName")) {
            profile.restaurantName = req.body.restaurantName || "";
        }
        if (Object.prototype.hasOwnProperty.call(req.body, "email")) {
            profile.email = req.body.email || "";
        }
        if (Object.prototype.hasOwnProperty.call(req.body, "phoneNumber")) {
            profile.phoneNumber = req.body.phoneNumber || "";
        }
        if (Object.prototype.hasOwnProperty.call(req.body, "address")) {
            profile.address = req.body.address || "";
        }
        if (Object.prototype.hasOwnProperty.call(req.body, "description")) {
            profile.description = req.body.description || "";
        }
        if (Object.prototype.hasOwnProperty.call(req.body, "openingHours")) {
            profile.openingHours = req.body.openingHours || "";
        }
        if (Object.prototype.hasOwnProperty.call(req.body, "headerTitle")) {
            profile.headerTitle = req.body.headerTitle || "";
        }
        if (Object.prototype.hasOwnProperty.call(req.body, "headerContent")) {
            profile.headerContent = req.body.headerContent || "";
        }
        if (Object.prototype.hasOwnProperty.call(req.body, "headerButtonText")) {
            profile.headerButtonText = req.body.headerButtonText || "";
        }
        if (Object.prototype.hasOwnProperty.call(req.body, "exploreMenuTitle")) {
            profile.exploreMenuTitle = req.body.exploreMenuTitle || "";
        }
        if (Object.prototype.hasOwnProperty.call(req.body, "exploreMenuDescription")) {
            profile.exploreMenuDescription = req.body.exploreMenuDescription || "";
        }

        const logoFile = req.files?.logo?.[0];
        const headerBackgroundFile = req.files?.headerBackgroundImage?.[0];

        if (logoFile) {
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

            profile.logo = `${logoFile.filename}`;
        }

        if (headerBackgroundFile) {
            if (profile.headerBackgroundImage) {
                const oldHeaderImagePath = `uploads/${profile.headerBackgroundImage}`;
                if (fs.existsSync(oldHeaderImagePath)) {
                    fs.unlink(oldHeaderImagePath, (err) => {
                        if (err) {
                            console.log("Error deleting old header background image:", err);
                        }
                    });
                }
            }

            profile.headerBackgroundImage = `${headerBackgroundFile.filename}`;
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
