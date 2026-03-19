import express from "express";
import {
    generateTestPayload,
    testPaymentSuccess,
    testPaymentFailure,
    verifyTestPayment,
    getTestCredentials
} from "../controllers/esewaTestController.js";

const esewaTestRouter = express.Router();

// Generate test payment payload
esewaTestRouter.post("/generate-payload", generateTestPayload);

// Get test credentials and instructions
esewaTestRouter.get("/credentials", getTestCredentials);

// Mock success callback
esewaTestRouter.get("/success", testPaymentSuccess);

// Mock failure callback
esewaTestRouter.get("/failure", testPaymentFailure);

// Verify test payment
esewaTestRouter.post("/verify", verifyTestPayment);

export default esewaTestRouter;
