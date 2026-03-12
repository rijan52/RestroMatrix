import express from "express";
import {
loginDriver,
registerDriver,
getAllDrivers,
getDriverById,
updateDriver,
updateDriverLocation,
deleteDriver
} from "../controllers/driverController.js";

const router = express.Router();

router.post("/login", loginDriver);
router.post("/register", registerDriver);

router.get("/all", getAllDrivers);
router.get("/:id", getDriverById);

router.put("/update/:id", updateDriver);
router.put("/location/:id", updateDriverLocation);

router.delete("/:id", deleteDriver);

export default router;