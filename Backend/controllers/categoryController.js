import categoryModel from "../models/categoryModel.js";
import foodModel from "../models/foodModel.js";
import fs from "fs";
import mongoose from "mongoose";

// Add category
const addCategory = async (req, res) => {
    let image_filename = `${req.file.filename}`;

    // Check for restaurantId
    if (!req.body.restaurantId) {
        return res.status(400).json({ success: false, message: "restaurantId is required" });
    }

    const category = new categoryModel({
        name: req.body.name,
        description: req.body.description || "",
        image: image_filename,
        restaurantId: req.body.restaurantId
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
        const filter = {};
        if (req.query.restaurantId) {
            filter.restaurantId = req.query.restaurantId;
        }
        const categories = await categoryModel.find(filter);
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

        // Remove all food items under this category for the same restaurant
        const foodsToDelete = await foodModel.find({
            category: category.name,
            restaurantId: category.restaurantId
        });

        for (const food of foodsToDelete) {
            const foodImagePath = `uploads/${food.image}`;
            if (fs.existsSync(foodImagePath)) {
                fs.unlink(foodImagePath, (err) => {
                    if (err) console.log("Error deleting food image:", err);
                });
            }
        }

        await foodModel.deleteMany({
            category: category.name,
            restaurantId: category.restaurantId
        });

        await categoryModel.findByIdAndDelete(categoryId);
        res.json({
            success: true,
            message: "Category Removed Successfully",
            deletedFoodCount: foodsToDelete.length
        });
    } catch (error) {
        console.log(error);
        res.json({ success: false, message: "Error removing category" });
    }
};

export { addCategory, listCategories, updateCategory, removeCategory };
