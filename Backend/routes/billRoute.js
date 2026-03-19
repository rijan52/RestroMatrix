import express from 'express';
import {
    createBill,
    getBill,
    initiateEsewaPayment,
    verifyPayment,
    getBillByQRCode,
    getAllBills,
    getBillPayments,
    getPayment,
    closeBill
} from '../controllers/billController.js';

const billRouter = express.Router();

// ===== MAIN APIs =====

// 1. CREATE BILL - POST /api/bills/create
billRouter.post('/create', createBill);

// Payment routes (must be before /:billId to avoid route conflicts)
// 3. INITIATE ESEWA PAYMENT - POST /api/payment/esewa/initiate
billRouter.post('/payment/esewa/initiate', initiateEsewaPayment);

// 4. PAYMENT SUCCESS VERIFICATION - GET /api/payment/success
billRouter.get('/payment/success', verifyPayment);

// Payment failure callback
billRouter.get('/payment/failure', (req, res) => {
    const { transaction_uuid } = req.query;
    return res.status(400).json({
        success: false,
        message: 'Payment failed',
        transactionId: transaction_uuid
    });
});

// ===== ADDITIONAL HELPER APIs =====

// Get all bills (must be before /:billId)
billRouter.get('/list', getAllBills);

// Get bill by QR code
billRouter.get('/qr/:qrCodeData', getBillByQRCode);

// 2. GET BILL DETAILS - GET /api/bills/:billId
billRouter.get('/:billId', getBill);

// Get all payments for a bill
billRouter.get('/:billId/payments', getBillPayments);

// Get specific payment
billRouter.get('/payment/:paymentId', getPayment);

// Close a bill
billRouter.post('/:billId/close', closeBill);

export default billRouter;
