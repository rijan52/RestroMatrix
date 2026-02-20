import "dotenv/config";
import express from "express";
import cors from "cors";
import { connectDB } from "./config/db.js";
import menuRouter from "./routes/menuRoute.js";
import orderRouter from "./routes/orderRoute.js";

const app = express();
const port = process.env.PORT || 4000;

const allowedOrigins = (process.env.CORS_ORIGIN || "")
    .split(",")
    .map((value) => value.trim())
    .filter(Boolean);

app.use(
    cors({
        origin: allowedOrigins.length ? allowedOrigins : true
    })
);
app.use(express.json());
app.use("/images", express.static("uploads"));

connectDB();

app.use("/api/menu", menuRouter);
app.use("/api/order", orderRouter);

app.get("/", (req, res) => {
    res.send("QR menu backend is running.");
});

app.listen(port, () => {
    console.log(`Server started on http://localhost:${port}`);
});
