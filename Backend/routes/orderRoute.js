import express from "express";
import authMiddleware from "../middleware/auth.js";
import { listOrders, placeOrder, updateOrderStatus, userOrders, verifyOrder, getOrderById } from "../controllers/orderController.js";

const orderRouter = express.Router();

orderRouter.post("/place", authMiddleware, placeOrder);
orderRouter.post("/verify", verifyOrder);
orderRouter.post("/userorders", authMiddleware, userOrders);
orderRouter.get("/list", listOrders);
orderRouter.post("/status", updateOrderStatus);
orderRouter.get("/:orderId", getOrderById);
export default orderRouter;