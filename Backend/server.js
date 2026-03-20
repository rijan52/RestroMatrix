import "dotenv/config";
import express from "express";
import cors from "cors";
import http from "http";
import { Server } from "socket.io";
import { connectDB } from "./config/db.js";
import foodRouter from "./routes/foodRoute.js";
import customerRouter from "./routes/customerRoute.js";
import driverRouter from "./routes/driverRoute.js";
import cartRouter from "./routes/cartRoute.js";
import orderRouter from "./routes/orderRoute.js";
import reservationRouter from "./routes/reservationRoute.js";
import billRouter from "./routes/billRoute.js";
import esewaTestRouter from "./routes/esewaTestRoute.js";
import { initiateEsewaPayment, verifyPayment, handlePaymentFailure } from "./controllers/billController.js";
import { paymentSuccess, paymentFailure, initiateEsewaPaymentOrder } from "./controllers/orderController.js";
import { initializeSocketHandlers } from "./socket/deliveryTracking.js";

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: ["http://localhost:5173", "http://localhost:5174", "http://localhost:5175"],
    credentials: true,
  },
});

const port = process.env.PORT || 4000;

// Middleware
app.use(cors({ credentials: true }));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Favicon handler - suppress 404 errors
app.get('/favicon.ico', (req, res) => {
  res.status(204).end();
});

// Connect database
connectDB();

// Validate JWT_SECRET
if (!process.env.JWT_SECRET) {
  console.error("ERROR: JWT_SECRET is not defined");
}

// Initialize Socket.IO handlers
initializeSocketHandlers(io);

// API routes
app.use("/api/food", foodRouter);
app.use("/images", express.static("uploads"));
app.use("/api/customer", customerRouter);
app.use("/api/driver", driverRouter);
app.use("/api/cart", cartRouter);
app.use("/api/order", orderRouter);
app.use("/api/reservation", reservationRouter);
app.use("/api/bills", billRouter);
app.use("/api/esewa-test", esewaTestRouter);

// Payment routes - SPLIT PAYMENTS (Bills/QR-based)
app.post("/api/payment/esewa/initiate", initiateEsewaPayment);
app.get("/api/payment/bill/success", verifyPayment);
app.get("/api/payment/bill/failure", handlePaymentFailure);

// Payment routes - ORDER PAYMENTS (Direct checkout)
app.post("/api/payment/order/esewa/initiate", initiateEsewaPaymentOrder);
app.get("/api/payment/success", paymentSuccess);
app.get("/api/payment/failure", paymentFailure);

app.get("/", (req, res) => {
  res.send("Server is working!");
});

// Start server with Socket.IO - wait a bit for DB connection to establish
setTimeout(() => {
  server.listen(port, () => {
    console.log(`✅ Server running on http://localhost:${port}`);
  });
}, 2000);

export { io };