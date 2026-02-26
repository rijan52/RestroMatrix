import "dotenv/config";
import express from "express";
import cors from "cors";
import { connectDB } from "./config/db.js";
import menuRouter from "./routes/menuRoute.js";
import orderRouter from "./routes/orderRoute.js";

const app = express();
const port = process.env.PORT || 4000;

// ===== FIXED CORS CONFIGURATION =====
const allowedOrigins = (process.env.CORS_ORIGIN || "")
    .split(",")
    .map((value) => value.trim())
    .filter(Boolean);

app.use(
    cors({
        origin: function (origin, callback) {
            // Allow requests with no origin (like Postman)
            if (!origin) return callback(null, true);

            // Allow if origin is in allowedOrigins
            if (allowedOrigins.includes(origin)) {
                return callback(null, true);
            } else {
                return callback(
                    new Error(
                        "CORS policy: This origin is not allowed - " + origin
                    )
                );
            }
        },
        credentials: true, // if you use cookies, optional
    })
);

// ===== REST OF MIDDLEWARE =====
app.use(express.json());
app.use("/images", express.static("uploads"));

// ===== DATABASE =====
connectDB();

// ===== ROUTES =====
app.use("/api/menu", menuRouter);
app.use("/api/order", orderRouter);

app.get("/", (req, res) => {
    res.send("QR menu backend is running.");
});

// ===== START SERVER =====
app.listen(port, () => {
    console.log(`Server started on http://localhost:${port}`);
});