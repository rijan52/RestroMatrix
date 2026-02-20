import express from "express";
import { createOrder, getOrderStatus } from "../controllers/orderController.js";

const orderRouter = express.Router();

orderRouter.post("/create", createOrder);
orderRouter.get("/status/:orderId", getOrderStatus);

export default orderRouter;
