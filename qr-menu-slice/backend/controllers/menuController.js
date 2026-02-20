import foodModel from "../models/foodModel.js";

export const listMenu = async (req, res) => {
    try {
        const foods = await foodModel.find({});
        res.json({ success: true, data: foods });
    } catch (error) {
        console.log(error);
        res.json({ success: false, message: "Unable to fetch menu" });
    }
};
