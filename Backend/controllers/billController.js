import crypto from 'crypto';
import billModel from '../models/billModel.js';
import paymentModel from '../models/paymentModel.js';
import axios from 'axios';

// Get eSewa sandbox configuration
const getEsewaConfig = () => {
    const env = process.env.ESEWA_ENV || 'sandbox';
    const endpoint = env === 'live'
        ? 'https://epay.esewa.com.np/api/epay/main/v2/form'
        : 'https://rc-epay.esewa.com.np/api/epay/main/v2/form';
    const verificationEndpoint = env === 'live'
        ? 'https://epay.esewa.com.np/api/epay/transaction/status/'
        : 'https://rc-epay.esewa.com.np/api/epay/transaction/status/';

    return {
        env,
        endpoint,
        verificationEndpoint,
        productCode: process.env.ESEWA_PRODUCT_CODE || 'EPAYTEST',
        secretKey: process.env.ESEWA_SECRET_KEY || '8gBm/:&EnhH.1/q'
    };
};

// CREATE BILL API - POST /api/bills/create
const createBill = async (req, res) => {
    try {
        const { tableNumber, totalAmount } = req.body;

        // Validation
        if (tableNumber === undefined || totalAmount === undefined) {
            return res.status(400).json({
                success: false,
                message: 'Table number and total amount are required'
            });
        }

        if (tableNumber <= 0) {
            return res.status(400).json({
                success: false,
                message: 'Table number must be greater than 0'
            });
        }

        if (totalAmount <= 0) {
            return res.status(400).json({
                success: false,
                message: 'Total amount must be greater than 0'
            });
        }

        // Generate unique QR code data
        const qrCodeData = `bill_${tableNumber}_${Date.now()}_${crypto.randomBytes(4).toString('hex')}`;

        const newBill = new billModel({
            tableNumber,
            totalAmount,
            paidAmount: 0,
            remainingAmount: totalAmount,
            status: 'UNPAID',
            qrActive: true,
            qrCodeData
        });

        await newBill.save();

        return res.status(201).json({
            billId: newBill._id,
            paymentUrl: `/api/pay/${newBill._id}`
        });
    } catch (error) {
        console.error('Error creating bill:', error);
        return res.status(500).json({
            success: false,
            message: 'Error creating bill',
            error: error.message
        });
    }
};

// GET BILL DETAILS - GET /api/bills/:billId
const getBill = async (req, res) => {
    try {
        const { billId } = req.params;

        const bill = await billModel.findById(billId);

        if (!bill) {
            return res.status(404).json({
                success: false,
                message: 'Bill not found'
            });
        }

        return res.status(200).json({
            totalAmount: bill.totalAmount,
            paidAmount: bill.paidAmount,
            remainingAmount: bill.remainingAmount,
            status: bill.status
        });
    } catch (error) {
        console.error('Error fetching bill:', error);
        return res.status(500).json({
            success: false,
            message: 'Error fetching bill',
            error: error.message
        });
    }
};

// Get bill by QR code data
const getBillByQRCode = async (req, res) => {
    try {
        const { qrCodeData } = req.params;

        const bill = await billModel.findOne({ qrCodeData });

        if (!bill) {
            return res.status(404).json({
                success: false,
                message: 'Bill not found with this QR code'
            });
        }

        if (!bill.qrActive) {
            return res.status(400).json({
                success: false,
                message: 'This bill is already paid. QR code is inactive.'
            });
        }

        // Get all payments for this bill
        const payments = await paymentModel.find({ billId: bill._id, status: 'SUCCESS' });

        return res.status(200).json({
            success: true,
            data: {
                bill,
                payments,
                canPay: bill.qrActive && bill.status === 'UNPAID'
            }
        });
    } catch (error) {
        console.error('Error fetching bill by QR:', error);
        return res.status(500).json({
            success: false,
            message: 'Error fetching bill',
            error: error.message
        });
    }
};

// Get all bills (with optional filters)
const getAllBills = async (req, res) => {
    try {
        const { status, tableNumber, page = 1, limit = 10 } = req.query;

        let query = {};

        if (status) {
            query.status = status;
        }

        if (tableNumber) {
            query.tableNumber = tableNumber;
        }

        const bills = await billModel
            .find(query)
            .sort({ createdAt: -1 })
            .skip((page - 1) * limit)
            .limit(parseInt(limit));

        const total = await billModel.countDocuments(query);

        return res.status(200).json({
            success: true,
            data: bills,
            pagination: {
                currentPage: parseInt(page),
                totalPages: Math.ceil(total / limit),
                total
            }
        });
    } catch (error) {
        console.error('Error fetching bills:', error);
        return res.status(500).json({
            success: false,
            message: 'Error fetching bills',
            error: error.message
        });
    }
};

// INITIATE ESEWA PAYMENT - POST /api/payment/esewa/initiate
const initiateEsewaPayment = async (req, res) => {
    try {
        const { billId, amount } = req.body;

        // Validation
        if (!billId || !amount) {
            return res.status(400).json({
                success: false,
                message: 'Bill ID and amount are required'
            });
        }

        if (amount <= 0) {
            return res.status(400).json({
                success: false,
                message: 'Amount must be greater than 0'
            });
        }

        // Fetch bill
        const bill = await billModel.findById(billId);

        if (!bill) {
            return res.status(404).json({
                success: false,
                message: 'Bill not found'
            });
        }

        // Validate bill status
        if (bill.status !== 'UNPAID') {
            return res.status(400).json({
                success: false,
                message: 'Bill must be in UNPAID status'
            });
        }

        if (!bill.qrActive) {
            return res.status(400).json({
                success: false,
                message: 'This bill is no longer accepting payments'
            });
        }

        if (amount > bill.remainingAmount) {
            return res.status(400).json({
                success: false,
                message: `Amount cannot exceed remaining amount (${bill.remainingAmount})`
            });
        }

        // Create payment record first
        const transactionId = `${billId}_${Date.now()}_${crypto.randomBytes(4).toString('hex')}`;

        const payment = new paymentModel({
            billId,
            amount,
            method: 'esewa',
            transactionId,
            status: 'PENDING'
        });

        await payment.save();

        // Get eSewa config
        const esewaConfig = getEsewaConfig();
        const backendUrl = process.env.BACKEND_URL || 'http://localhost:4000';

        // Prepare eSewa payload
        const payload = {
            amount,
            tax_amount: 0,
            total_amount: amount,
            transaction_uuid: transactionId,
            product_code: esewaConfig.productCode,
            product_name: `Table ${bill.tableNumber} Bill Payment`,
            success_url: `${backendUrl}/api/payment/success?transaction_uuid=${transactionId}`,
            failure_url: `${backendUrl}/api/payment/failure?transaction_uuid=${transactionId}`,
            signed_field_names: 'total_amount,transaction_uuid,product_code'
        };

        // Generate signature
        const signedFieldNames = payload.signed_field_names;
        const signatureData = signedFieldNames
            .split(',')
            .map(field => payload[field])
            .join(',');

        const signature = crypto
            .createHmac('sha256', esewaConfig.secretKey)
            .update(signatureData)
            .digest('base64');

        // Return payment form data
        return res.status(200).json({
            amount: payload.amount,
            tax_amount: payload.tax_amount,
            total_amount: payload.total_amount,
            transaction_uuid: payload.transaction_uuid,
            product_code: payload.product_code,
            product_name: payload.product_name,
            success_url: payload.success_url,
            failure_url: payload.failure_url,
            signed_field_names: payload.signed_field_names,
            signature,
            paymentEndpoint: esewaConfig.endpoint
        });
    } catch (error) {
        console.error('Error initiating eSewa payment:', error);
        return res.status(500).json({
            success: false,
            message: 'Error initiating payment',
            error: error.message
        });
    }
};

// PAYMENT SUCCESS VERIFICATION - GET /api/payment/success
const verifyPayment = async (req, res) => {
    try {
        const { transaction_uuid, status, transaction_code } = req.query;

        // Validation
        if (!transaction_uuid) {
            return res.status(400).json({
                success: false,
                message: 'Transaction UUID is required'
            });
        }

        // Find payment record
        const payment = await paymentModel.findOne({ transactionId: transaction_uuid });

        if (!payment) {
            return res.status(404).json({
                success: false,
                message: 'Payment not found'
            });
        }

        // Prevent duplicate processing
        if (payment.status === 'SUCCESS') {
            return res.status(400).json({
                success: false,
                message: 'Payment already processed'
            });
        }

        if (status !== 'COMPLETE') {
            payment.status = 'FAILED';
            payment.failedAt = new Date();
            payment.failureReason = 'eSewa transaction did not complete';
            await payment.save();

            return res.status(400).json({
                success: false,
                message: 'Payment verification failed: transaction not completed'
            });
        }

        // Verify with eSewa API
        try {
            const esewaConfig = getEsewaConfig();

            const esewaResponse = await axios.get(
                `${esewaConfig.verificationEndpoint}${transaction_uuid}`,
                {
                    headers: {
                        'Content-Type': 'application/json'
                    }
                }
            );

            if (!esewaResponse.data || esewaResponse.data.status !== 'COMPLETE') {
                payment.status = 'FAILED';
                payment.failedAt = new Date();
                payment.failureReason = 'eSewa API verification failed';
                await payment.save();

                return res.status(400).json({
                    success: false,
                    message: 'eSewa verification failed'
                });
            }
        } catch (esewaError) {
            console.error('eSewa verification error:', esewaError.message);
            payment.status = 'FAILED';
            payment.failedAt = new Date();
            payment.failureReason = `eSewa API error: ${esewaError.message}`;
            await payment.save();

            return res.status(500).json({
                success: false,
                message: 'Error verifying with eSewa',
                error: esewaError.message
            });
        }

        // Fetch bill
        const bill = await billModel.findById(payment.billId);

        if (!bill) {
            return res.status(404).json({
                success: false,
                message: 'Bill not found'
            });
        }

        // Prevent overpayment
        const newPaidAmount = bill.paidAmount + payment.amount;
        if (newPaidAmount > bill.totalAmount) {
            payment.status = 'FAILED';
            payment.failedAt = new Date();
            payment.failureReason = 'Payment would exceed total bill amount';
            await payment.save();

            return res.status(400).json({
                success: false,
                message: 'Payment would exceed total bill amount'
            });
        }

        // Mark payment as successful
        payment.status = 'SUCCESS';
        payment.paidAt = new Date();
        if (transaction_code) {
            payment.esewaDetails = {
                esewaTransactionId: transaction_code
            };
        }
        await payment.save();

        // Update bill
        bill.paidAmount = newPaidAmount;
        bill.remainingAmount = bill.totalAmount - bill.paidAmount;

        if (bill.paidAmount >= bill.totalAmount) {
            bill.status = 'PAID';
            bill.qrActive = false;
        }

        await bill.save();

        return res.status(200).json({
            success: true,
            message: 'Payment verified and processed successfully',
            data: {
                billId: bill._id,
                totalAmount: bill.totalAmount,
                paidAmount: bill.paidAmount,
                remainingAmount: bill.remainingAmount,
                status: bill.status
            }
        });
    } catch (error) {
        console.error('Error verifying payment:', error);
        return res.status(500).json({
            success: false,
            message: 'Error verifying payment',
            error: error.message
        });
    }
};

// Get payments for a bill
const getBillPayments = async (req, res) => {
    try {
        const { billId } = req.params;

        const payments = await paymentModel
            .find({ billId })
            .sort({ createdAt: -1 });

        if (payments.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'No payments found for this bill'
            });
        }

        return res.status(200).json({
            success: true,
            data: payments
        });
    } catch (error) {
        console.error('Error fetching payments:', error);
        return res.status(500).json({
            success: false,
            message: 'Error fetching payments',
            error: error.message
        });
    }
};

// Get payment by ID
const getPayment = async (req, res) => {
    try {
        const { paymentId } = req.params;

        const payment = await paymentModel.findById(paymentId);

        if (!payment) {
            return res.status(404).json({
                success: false,
                message: 'Payment not found'
            });
        }

        return res.status(200).json({
            success: true,
            data: payment
        });
    } catch (error) {
        console.error('Error fetching payment:', error);
        return res.status(500).json({
            success: false,
            message: 'Error fetching payment',
            error: error.message
        });
    }
};

// Close a bill (mark as completed/no more payments)
const closeBill = async (req, res) => {
    try {
        const { billId } = req.params;

        const bill = await billModel.findById(billId);

        if (!bill) {
            return res.status(404).json({
                success: false,
                message: 'Bill not found'
            });
        }

        bill.qrActive = false;
        bill.status = bill.paidAmount >= bill.totalAmount ? 'PAID' : 'UNPAID';
        await bill.save();

        return res.status(200).json({
            success: true,
            message: 'Bill closed successfully',
            data: bill
        });
    } catch (error) {
        console.error('Error closing bill:', error);
        return res.status(500).json({
            success: false,
            message: 'Error closing bill',
            error: error.message
        });
    }
};

export {
    createBill,
    getBill,
    initiateEsewaPayment,
    verifyPayment,
    getBillByQRCode,
    getAllBills,
    getBillPayments,
    getPayment,
    closeBill
};
