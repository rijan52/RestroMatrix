import foodModel from "../models/foodModel.js";
import fs from "fs";

//add food item

const addFood = async (req, res) => {
    let image_filename = `${req.file.filename}`;

    const food = new foodModel({
        name: req.body.name,
        description: req.body.description,
        price: Number(req.body.price),
        category: req.body.category,
        image: image_filename
    })
    try {
        await food.save();
        res.json({ success: true, message: "Food Item Added Successfully" })
    } catch (error) {
        console.log(error)
        res.json({ success: false, message: "Error" })

    }
}

// all food list
const listFood = async (req, res) => {
    try {
        const foods = await foodModel.find({});
        res.json({ success: true, data: foods });
    } catch (error) {
        console.log(error);
        res.json({ success: false, message: "Error" })
    }
}

// category list
const listCategories = async (req, res) => {
    try {
        const categories = await foodModel.distinct("category");
        const formattedCategories = categories
            .filter((category) => typeof category === "string" && category.trim() !== "")
            .map((category, index) => ({
                _id: `${index}-${category}`,
                name: category
            }));

        res.json({ success: true, data: formattedCategories });
    } catch (error) {
        console.log(error);
        res.json({ success: false, message: "Error fetching categories" });
    }
}

// update food item
const updateFood = async (req, res) => {
    try {
        const foodId = req.body.id;
        const food = await foodModel.findById(foodId);

        if (!food) {
            return res.json({ success: false, message: "Food item not found" });
        }

        // Update text fields
        food.name = req.body.name || food.name;
        food.description = req.body.description || food.description;
        food.price = req.body.price ? Number(req.body.price) : food.price;
        food.category = req.body.category || food.category;

        // Update image if a new one is provided
        if (req.file) {
            // Delete old image
            const oldImagePath = `uploads/${food.image}`;
            if (fs.existsSync(oldImagePath)) {
                fs.unlink(oldImagePath, (err) => {
                    if (err) console.log("Error deleting old image:", err);
                });
            }
            // Set new image
            food.image = `${req.file.filename}`;
        }

        await food.save();
        res.json({ success: true, message: "Food Item Updated Successfully" });
    } catch (error) {
        console.log(error);
        res.json({ success: false, message: "Error updating food item" });
    }
};

// remove food item
const removeFood = async (req, res) => {

    try {
        const foodId = await foodModel.findById(req.body.id);
        fs.unlink(`uploads/${foodId.image}`, () => { })
        await foodModel.findByIdAndDelete(req.body.id);
        res.json({ success: true, message: "Food  Removed Successfully" })
    }
    catch (error) {
        console.log(error);
        res.json({ success: false, message: "Error" })

    }
}


export { addFood, listFood, listCategories, removeFood, updateFood }