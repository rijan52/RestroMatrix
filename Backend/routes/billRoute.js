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

// Note: Payment routes are now registered directly in server.js
// to avoid path conflicts (at /api/payment/esewa/initiate)

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
