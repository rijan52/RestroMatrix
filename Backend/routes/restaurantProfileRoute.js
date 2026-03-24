import express from "express";
import multer from "multer";
import {
    getRestaurantProfile,
    updateRestaurantProfile,
} from "../controllers/restaurantProfileController.js";

const restaurantProfileRouter = express.Router();

const storage = multer.diskStorage({
    destination: "uploads",
    filename: (req, file, cb) => {
        return cb(null, `${Date.now()}--${file.originalname}`);
    },
});

const upload = multer({ storage: storage });

restaurantProfileRouter.get("/", getRestaurantProfile);
restaurantProfileRouter.post(
    "/update",
    upload.fields([
        { name: "logo", maxCount: 1 },
        { name: "headerBackgroundImage", maxCount: 1 },
    ]),
    updateRestaurantProfile
);

export default restaurantProfileRouter;
