import crypto from "crypto";
import { v4 as uuidv4 } from "uuid";
import walkInSessionModel from "../models/walkInSessionModel.js";

/**
 *  WALK-IN PAYMENT CONTROLLER
 * Handles split payments for QR-based dine-in customers
 * IMPORTANT: Uses separate transaction UUIDs per payment to avoid conflicts with online orders
 */

const getEsewaConfig = () => {
    const env = process.env.ESEWA_ENV || "sandbox";
    const endpoint =
        env === "live"
            ? "https://epay.esewa.com.np/api/epay/main/v2/form"
            : "https://rc-epay.esewa.com.np/api/epay/main/v2/form";
    const statusEndpoint =
        env === "live"
            ? "https://epay.esewa.com.np/api/epay/transaction/status/"
            : "https://rc-epay.esewa.com.np/api/epay/transaction/status/";

    return {
        env,
        endpoint,
        statusEndpoint,
        productCode: process.env.ESEWA_PRODUCT_CODE || "EPAYTEST",
        secretKey: process.env.ESEWA_SECRET_KEY || "8gBm/:&EnhH.1/q",
    };
};

const signEsewaPayload = (
    { total_amount, transaction_uuid, product_code },
    secretKey
) => {
    const message = `total_amount=${total_amount},transaction_uuid=${transaction_uuid},product_code=${product_code}`;
    return crypto.createHmac("sha256", secretKey).update(message).digest("base64");
};

const formatAmount = (amount) => Number(amount).toFixed(2);

/**
 * GET: /api/walkin/session/:sessionId
 * Retrieve session details and payment status
 */
export const getSessionDetails = async (req, res) => {
    try {
        const { sessionId } = req.params;

        if (!sessionId) {
            return res.status(400).json({
                success: false,
                message: "Session ID is required",
            });
        }

        const session = await walkInSessionModel.findOne({ sessionId });

        if (!session) {
            return res.status(404).json({
                success: false,
                message: "Session not found",
            });
        }

        // Calculate remaining balance
        const remainingBalance = formatAmount(
            session.totalBillAmount - session.totalPaidAmount
        );

        res.json({
            success: true,
            data: {
                sessionId: session.sessionId,
                tableNumber: session.tableNumber,
                items: session.items,
                totalBillAmount: session.totalBillAmount,
                totalPaidAmount: session.totalPaidAmount,
                remainingBalance: parseFloat(remainingBalance),
                status: session.status,
                paymentHistory: session.payments,
                createdAt: session.createdAt,
                updatedAt: session.updatedAt,
            },
        });
    } catch (error) {
        console.error(" Error fetching session details:", error);
        res.status(500).json({
            success: false,
            message: "Unable to fetch session details",
        });
    }
};

/**
 * POST: /api/walkin/payment/initiate
 * Initiate a split payment for a walk-in session
 * IMPORTANT: Generates unique transactionUuid for each payment attempt
 */
export const initiateWalkInPayment = async (req, res) => {
    try {
        const { sessionId, amount, successUrl, failureUrl } = req.body;

        // Validation
        if (!sessionId) {
            return res.status(400).json({
                success: false,
                message: "Session ID is required",
            });
        }

        if (!amount || amount <= 0) {
            return res.status(400).json({
                success: false,
                message: "Valid payment amount is required",
            });
        }

        // Fetch session
        const session = await walkInSessionModel.findOne({ sessionId });

        if (!session) {
            return res.status(404).json({
                success: false,
                message: "Session not found",
            });
        }

        // Validate payment amount
        const remainingBalance = session.totalBillAmount - session.totalPaidAmount;

        if (amount > remainingBalance) {
            return res.status(400).json({
                success: false,
                message: `Payment amount exceeds remaining balance (${formatAmount(remainingBalance)} NPR)`,
            });
        }

        // Generate unique transaction UUID for this payment
        const transactionUuid = uuidv4();
        const paymentId = uuidv4();

        const config = getEsewaConfig();
        const formattedAmount = formatAmount(amount);

        // Create signature
        const signature = signEsewaPayload(
            {
                total_amount: formattedAmount,
                transaction_uuid: transactionUuid,
                product_code: config.productCode,
            },
            config.secretKey
        );

        // Store payment record in session (pending status)
        const paymentRecord = {
            paymentId,
            transactionUuid,
            amountPaid: parseFloat(formattedAmount),
            status: "pending",
        };

        session.payments.push(paymentRecord);
        session.updatedAt = new Date();
        await session.save();

        // Build eSewa redirect with callback URLs
        const baseUrl = config.endpoint;
        const successCallbackUrl =
            successUrl ||
            `${process.env.FRONTEND_URL || "http://localhost:5173"}/walkin/payment/success?sessionId=${sessionId}&paymentId=${paymentId}&transactionUuid=${transactionUuid}`;
        const failureCallbackUrl =
            failureUrl ||
            `${process.env.FRONTEND_URL || "http://localhost:5173"}/walkin/payment/failure?sessionId=${sessionId}&paymentId=${paymentId}`;

        res.json({
            success: true,
            esewaUrl: baseUrl,
            esewaParams: {
                amount: formattedAmount,
                failure_url: failureCallbackUrl,
                product_code: config.productCode,
                product_service_charge: "0",
                product_delivery_charge: "0",
                success_url: successCallbackUrl,
                tax_amount: "0",
                total_amount: formattedAmount,
                transaction_uuid: transactionUuid,
                signature,
            },
            paymentId,
            transactionUuid,
        });
    } catch (error) {
        console.error("Error initiating walk-in payment:", error);
        res.status(500).json({
            success: false,
            message: "Unable to initiate payment",
        });
    }
};

/**
 * GET: /api/walkin/payment/verify
 * Verify payment status from eSewa callback
 * Query params: sessionId, transactionUuid, oid, refId, amount
 */
export const verifyWalkInPayment = async (req, res) => {
    try {
        const { sessionId, transactionUuid, oid, refId, amount } = req.query;

        if (!sessionId || !transactionUuid) {
            return res.status(400).json({
                success: false,
                message: "Session ID and transaction UUID are required",
            });
        }

        // Fetch session
        const session = await walkInSessionModel.findOne({ sessionId });

        if (!session) {
            return res.status(404).json({
                success: false,
                message: "Session not found",
            });
        }

        // Find the payment record
        const paymentRecord = session.payments.find(
            (p) => p.transactionUuid === transactionUuid
        );

        if (!paymentRecord) {
            return res.status(404).json({
                success: false,
                message: "Payment record not found",
            });
        }

        // If payment already processed, return status
        if (paymentRecord.status === "success") {
            return res.json({
                success: true,
                message: "Payment already verified",
                data: {
                    sessionId,
                    status: "success",
                    totalPaidAmount: session.totalPaidAmount,
                    remainingBalance:
                        session.totalBillAmount - session.totalPaidAmount,
                },
            });
        }

        // Verify with eSewa
        const config = getEsewaConfig();
        const verificationUrl = config.statusEndpoint + transactionUuid;

        const verificationResponse = await fetch(
            `${verificationUrl}?oid=${oid}`,
            {
                method: "GET",
                headers: {
                    "Content-Type": "application/json",
                },
            }
        );

        const verificationData = await verificationResponse.json();

        // Update payment status based on eSewa response
        if (
            verificationData.status === "COMPLETE" ||
            verificationData.status === "PENDING"
        ) {
            paymentRecord.status = "success";
            paymentRecord.esewaRefId = refId || oid;

            // Update total paid amount
            session.totalPaidAmount += paymentRecord.amountPaid;

            // Update session status
            const remainingBalance =
                session.totalBillAmount - session.totalPaidAmount;
            if (remainingBalance <= 0) {
                session.status = "fully_paid";
            } else {
                session.status = "awaiting_payment";
            }

            session.updatedAt = new Date();
            await session.save();

            res.json({
                success: true,
                message: "Payment verified successfully",
                data: {
                    sessionId,
                    paymentId: paymentRecord.paymentId,
                    status: "success",
                    amountPaid: paymentRecord.amountPaid,
                    totalPaidAmount: session.totalPaidAmount,
                    remainingBalance,
                    sessionStatus: session.status,
                },
            });
        } else {
            paymentRecord.status = "failed";
            session.updatedAt = new Date();
            await session.save();

            res.status(400).json({
                success: false,
                message: "Payment verification failed",
                verificationStatus: verificationData.status,
            });
        }
    } catch (error) {
        console.error("Error verifying walk-in payment:", error);
        res.status(500).json({
            success: false,
            message: "Unable to verify payment",
        });
    }
};

/**
 * GET: /api/walkin/payment/failure
 * Handle payment failure callback
 */
export const handleWalkInPaymentFailure = async (req, res) => {
    try {
        const { sessionId, transactionUuid } = req.query;

        if (!sessionId || !transactionUuid) {
            return res.status(400).json({
                success: false,
                message: "Session ID and transaction UUID are required",
            });
        }

        const session = await walkInSessionModel.findOne({ sessionId });

        if (!session) {
            return res.status(404).json({
                success: false,
                message: "Session not found",
            });
        }

        const paymentRecord = session.payments.find(
            (p) => p.transactionUuid === transactionUuid
        );

        if (paymentRecord) {
            paymentRecord.status = "failed";
            session.updatedAt = new Date();
            await session.save();
        }

        res.json({
            success: false,
            message: "Payment failed",
            sessionId,
        });
    } catch (error) {
        console.error("Error handling walk-in payment failure:", error);
        res.status(500).json({
            success: false,
            message: "Unable to handle failure",
        });
    }
};

/**
 * POST: /api/walkin/session/create
 * Create a new walk-in session (called when QR is scanned)
 */
export const createWalkInSession = async (req, res) => {
    try {
        const { tableNumber, items, totalBillAmount } = req.body;

        if (!tableNumber) {
            return res.status(400).json({
                success: false,
                message: "Table number is required",
            });
        }

        if (!totalBillAmount || totalBillAmount <= 0) {
            return res.status(400).json({
                success: false,
                message: "Valid total bill amount is required",
            });
        }

        if (!Array.isArray(items) || items.length === 0) {
            return res.status(400).json({
                success: false,
                message: "At least one ordered item is required",
            });
        }

        const normalizedItems = items
            .map((item) => ({
                foodId: item.foodId || item.menuId,
                name: item.name,
                price: Number(item.price),
                quantity: Number(item.quantity),
            }))
            .filter(
                (item) =>
                    item.name &&
                    Number.isFinite(item.price) &&
                    Number.isFinite(item.quantity) &&
                    item.quantity > 0
            );

        if (!normalizedItems.length) {
            return res.status(400).json({
                success: false,
                message: "Ordered items are invalid",
            });
        }

        const sessionId = `WALKIN-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

        const newSession = new walkInSessionModel({
            sessionId,
            tableNumber,
            items: normalizedItems,
            totalBillAmount,
            status: "active",
        });

        await newSession.save();

        res.status(201).json({
            success: true,
            message: "Session created successfully",
            data: {
                sessionId: newSession.sessionId,
                tableNumber: newSession.tableNumber,
                totalBillAmount: newSession.totalBillAmount,
            },
        });
    } catch (error) {
        console.error(" Error creating walk-in session:", error);
        res.status(500).json({
            success: false,
            message: "Unable to create session",
        });
    }
};

/**
 * GET: /api/walkin/list
 * List all walk-in sessions for admin panel
 */
export const listWalkInSessions = async (req, res) => {
    try {
        const sessions = await walkInSessionModel
            .find({})
            .sort({ updatedAt: -1 });

        // Format sessions to match order display format
        const formattedSessions = sessions.map((session) => ({
            _id: session._id,
            sessionId: session.sessionId,
            tableNumber: session.tableNumber,
            items: session.items,
            totalBillAmount: session.totalBillAmount,
            totalPaidAmount: session.totalPaidAmount,
            status: session.status,
            amount: session.totalBillAmount,
            payments: session.payments,
            date: session.updatedAt,
            source: "walkin",
        }));

        res.json({
            success: true,
            data: formattedSessions,
        });
    } catch (error) {
        console.error("Error listing walk-in sessions:", error);
        res.status(500).json({
            success: false,
            message: "Unable to fetch sessions",
        });
    }
};

/**
 * POST: /api/walkin/status
 * Update walk-in session status (for admin panel)
 */
export const updateWalkInSessionStatus = async (req, res) => {
    try {
        const { sessionId, status } = req.body;

        if (!sessionId) {
            return res.status(400).json({
                success: false,
                message: "Session ID is required",
            });
        }

        if (!status) {
            return res.status(400).json({
                success: false,
                message: "Status is required",
            });
        }

        // Validate status value
        const validStatuses = ["active", "awaiting_payment", "fully_paid", "closed"];
        if (!validStatuses.includes(status)) {
            return res.status(400).json({
                success: false,
                message: "Invalid status value",
            });
        }

        const session = await walkInSessionModel.findOne({ sessionId });

        if (!session) {
            return res.status(404).json({
                success: false,
                message: "Session not found",
            });
        }

        session.status = status;
        session.updatedAt = new Date();
        await session.save();

        res.json({
            success: true,
            message: "Session status updated successfully",
            data: {
                sessionId: session.sessionId,
                status: session.status,
            },
        });
    } catch (error) {
        console.error("Error updating walk-in session status:", error);
        res.status(500).json({
            success: false,
            message: "Unable to update session status",
        });
    }
};
