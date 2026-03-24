import categoryModel from "../models/categoryModel.js";
import fs from "fs";

// Add category
const addCategory = async (req, res) => {
    let image_filename = `${req.file.filename}`;

    const category = new categoryModel({
        name: req.body.name,
        description: req.body.description || "",
        image: image_filename
    });

    try {
        await category.save();
        res.json({ success: true, message: "Category Added Successfully", data: category });
    } catch (error) {
        console.log(error);
        if (error.code === 11000) {
            res.json({ success: false, message: "Category already exists" });
        } else {
            res.json({ success: false, message: "Error adding category" });
        }
    }
};

// Get all categories
const listCategories = async (req, res) => {
    try {
        const categories = await categoryModel.find({});
        res.json({ success: true, data: categories });
    } catch (error) {
        console.log(error);
        res.json({ success: false, message: "Error fetching categories" });
    }
};

// Update category
const updateCategory = async (req, res) => {
    try {
        const categoryId = req.body.id;
        const category = await categoryModel.findById(categoryId);

        if (!category) {
            return res.json({ success: false, message: "Category not found" });
        }

        // Update text fields
        category.name = req.body.name || category.name;
        category.description = req.body.description || category.description;

        // Update image if a new one is provided
        if (req.file) {
            // Delete old image
            const oldImagePath = `uploads/${category.image}`;
            if (fs.existsSync(oldImagePath)) {
                fs.unlink(oldImagePath, (err) => {
                    if (err) console.log("Error deleting old image:", err);
                });
            }
            // Set new image
            category.image = `${req.file.filename}`;
        }

        await category.save();
        res.json({ success: true, message: "Category Updated Successfully", data: category });
    } catch (error) {
        console.log(error);
        if (error.code === 11000) {
            res.json({ success: false, message: "Category name already exists" });
        } else {
            res.json({ success: false, message: "Error updating category" });
        }
    }
};

// Remove category
const removeCategory = async (req, res) => {
    try {
        const categoryId = req.body.id;
        const category = await categoryModel.findById(categoryId);

        if (!category) {
            return res.json({ success: false, message: "Category not found" });
        }

        // Delete image
        const imagePath = `uploads/${category.image}`;
        if (fs.existsSync(imagePath)) {
            fs.unlink(imagePath, (err) => {
                if (err) console.log("Error deleting image:", err);
            });
        }

        await categoryModel.findByIdAndDelete(categoryId);
        res.json({ success: true, message: "Category Removed Successfully" });
    } catch (error) {
        console.log(error);
        res.json({ success: false, message: "Error removing category" });
    }
};

export { addCategory, listCategories, updateCategory, removeCategory };
