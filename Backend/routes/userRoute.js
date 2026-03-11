import express from 'express';
import { loginUser, registerUser, getDrivers, deleteDriver } from '../controllers/userController.js';

const userRouter = express.Router()


userRouter.post("/register", registerUser)
userRouter.post("/login", loginUser)
userRouter.get("/drivers", getDrivers)
userRouter.delete("/driver/:id", deleteDriver)

export default userRouter;