import express from "express";
import multer from "multer";
import {
    getRestaurantProfile,
    updateRestaurantProfile,
    loginRestaurant,
    registerRestaurant,
    getRestaurantProfileById,
} from "../controllers/restaurantProfileController.js";

const restaurantProfileRouter = express.Router();
// Route to get restaurant profile by ID
restaurantProfileRouter.get("/:id", getRestaurantProfileById);
restaurantProfileRouter.post("/register", registerRestaurant);

const storage = multer.diskStorage({
    destination: "uploads",
    filename: (req, file, cb) => {
        return cb(null, `${Date.now()}--${file.originalname}`);
    },
});

const upload = multer({ storage: storage });

restaurantProfileRouter.get("/", getRestaurantProfile);
restaurantProfileRouter.post("/login", loginRestaurant);
restaurantProfileRouter.post(
    "/update",
    upload.fields([
        { name: "logo", maxCount: 1 },
        { name: "headerBackgroundImage", maxCount: 1 },
    ]),
    updateRestaurantProfile
);

export default restaurantProfileRouter;
