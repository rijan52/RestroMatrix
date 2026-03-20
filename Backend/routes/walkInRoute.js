import express from "express";
import {
    createWalkInSession,
    getSessionDetails,
    initiateWalkInPayment,
    verifyWalkInPayment,
    handleWalkInPaymentFailure,
    listWalkInSessions,
    updateWalkInSessionStatus,
} from "../controllers/walkInPaymentController.js";

const walkInRouter = express.Router();

// Session management
walkInRouter.post("/session/create", createWalkInSession);
walkInRouter.get("/session/:sessionId", getSessionDetails);
walkInRouter.get("/list", listWalkInSessions);
walkInRouter.post("/status", updateWalkInSessionStatus);

// Payment handling - SEPARATE FROM ONLINE ORDERS
walkInRouter.post("/payment/initiate", initiateWalkInPayment);
walkInRouter.get("/payment/verify", verifyWalkInPayment);
walkInRouter.get("/payment/failure", handleWalkInPaymentFailure);

export default walkInRouter;
