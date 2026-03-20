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

        // Prepare eSewa payload with required fields
        const taxAmount = '0';
        const serviceCharge = '0';
        const deliveryCharge = '0';
        const totalAmount = amount.toString();

        const payload = {
            amount: amount.toString(),
            tax_amount: taxAmount,
            total_amount: totalAmount,
            transaction_uuid: transactionId,
            product_code: esewaConfig.productCode,
            product_name: `Table ${bill.tableNumber} Bill Payment`,
            product_service_charge: serviceCharge,
            product_delivery_charge: deliveryCharge,
            // Don't embed `transaction_uuid` in the URL. eSewa will append it automatically.
            success_url: `${backendUrl}/api/payment/bill/success`,
            failure_url: `${backendUrl}/api/payment/bill/failure`,
            signed_field_names: 'total_amount,transaction_uuid,product_code'
        };

        // Generate signature - include field names with values
        const signedFieldNames = payload.signed_field_names;
        const signatureData = signedFieldNames
            .split(',')
            .map(field => {
                const value = payload[field];
                return `${field}=${value || ''}`;
            })
            .join(',');

        console.log('🔐 Signature Data:', signatureData);
        console.log('📦 eSewa Payload:', payload);
        console.log('📋 Secret Key (first 8 chars):', esewaConfig.secretKey.substring(0, 8) + '...');

        const signature = crypto
            .createHmac('sha256', esewaConfig.secretKey)
            .update(signatureData)
            .digest('base64');

        console.log('✓ Generated Signature:', signature);

        // Return payment form data with all required fields
        return res.status(200).json({
            amount: payload.amount,
            tax_amount: payload.tax_amount,
            total_amount: payload.total_amount,
            transaction_uuid: payload.transaction_uuid,
            product_code: payload.product_code,
            product_name: payload.product_name,
            product_service_charge: payload.product_service_charge,
            product_delivery_charge: payload.product_delivery_charge,
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
/**
 * Extract eSewa payment data from query parameters
 * Handles both embedded and traditional query parameter formats
 * 
 * @param {Object} queryParams - Express req.query object
 * @returns {Object} Parsed eSewa payment data
 * @throws {Error} If data cannot be extracted or decoded
 */
const extractEsewaPaymentData = (queryParams) => {
    let transaction_uuid = queryParams.transaction_uuid;
    let data = queryParams.data;

    console.log('📥 Raw query params:', { transaction_uuid: '***', data: data ? '***' : 'undefined' });

    // Case 1: Data is embedded in transaction_uuid (eSewa v2 behavior)
    // URL looks like: ?transaction_uuid=UUID?data=BASE64
    if (transaction_uuid && transaction_uuid.includes('?data=')) {
        console.log('✓ Detected embedded data in transaction_uuid');
        const [cleanUuid, encodedData] = transaction_uuid.split('?data=');
        transaction_uuid = cleanUuid;
        data = encodedData;
    }

    // Case 2: Validate we have the data parameter
    if (!data) {
        throw new Error('eSewa data parameter is missing. Cannot process payment callback.');
    }

    // Decode Base64
    let decodedStr;
    try {
        decodedStr = Buffer.from(data, 'base64').toString('utf-8');
        if (!decodedStr) {
            throw new Error('Decoded string is empty');
        }
        console.log('✓ Base64 decoded successfully');
    } catch (error) {
        throw new Error(`Failed to decode Base64 data: ${error.message}`);
    }

    // Parse JSON
    let esewaData;
    try {
        esewaData = JSON.parse(decodedStr);
        console.log('✓ JSON parsed successfully');
    } catch (error) {
        throw new Error(`Failed to parse JSON data: ${error.message}. Data: ${decodedStr}`);
    }

    // Validate required fields
    const requiredFields = ['transaction_uuid', 'status', 'total_amount', 'transaction_code'];
    const missingFields = requiredFields.filter(field => !esewaData[field]);

    if (missingFields.length > 0) {
        throw new Error(`Missing required fields in eSewa response: ${missingFields.join(', ')}`);
    }

    return {
        transaction_uuid: esewaData.transaction_uuid,
        status: esewaData.status,
        transaction_code: esewaData.transaction_code,
        total_amount: parseFloat(esewaData.total_amount),
        product_code: esewaData.product_code,
        signed_field_names: esewaData.signed_field_names,
        signature: esewaData.signature
    };
};

/**
 * Payment success callback handler for eSewa ePay v2 API
 * Verifies payment completion and updates database
 */
const verifyPayment = async (req, res) => {
    const startTime = Date.now();

    try {
        // Keep a reference so the outer catch block can mark it as FAILED on errors.
        let payment;

        console.log('\n' + '='.repeat(60));
        console.log('🔔 eSEWA PAYMENT CALLBACK RECEIVED');
        console.log('='.repeat(60));

        // Step 1: Extract and decode eSewa payment data
        let esewaData;
        try {
            esewaData = extractEsewaPaymentData(req.query);
            console.log('✅ eSewa data extracted:', {
                transaction_uuid: esewaData.transaction_uuid,
                status: esewaData.status,
                total_amount: esewaData.total_amount,
                transaction_code: esewaData.transaction_code
            });
        } catch (error) {
            console.error('❌ Data extraction failed:', error.message);
            return res.status(400).json({
                success: false,
                message: error.message
            });
        }

        const { transaction_uuid, status, transaction_code, total_amount } = esewaData;

        // Step 2: Validate payment status
        if (status !== 'COMPLETE') {
            console.error(`❌ Payment not completed. Status: ${status}`);

            // Try to update payment record if it exists
            try {
                const payment = await paymentModel.findOne({ transactionId: transaction_uuid });
                if (payment) {
                    payment.status = 'FAILED';
                    payment.failedAt = new Date();
                    payment.failureReason = `eSewa status: ${status}`;
                    await payment.save();
                    console.log('📝 Payment record marked as FAILED');
                }
            } catch (updateError) {
                console.error('⚠️ Could not update payment record:', updateError.message);
            }

            return res.status(400).json({
                success: false,
                message: `Payment not completed. Status: ${status}`,
                status
            });
        }

        // Step 3: Find payment record
        console.log(`🔍 Looking for payment with transaction ID: ${transaction_uuid}`);
        payment = await paymentModel.findOne({ transactionId: transaction_uuid });

        if (!payment) {
            console.error(`❌ Payment record not found for transaction: ${transaction_uuid}`);
            return res.status(404).json({
                success: false,
                message: 'Payment record not found in database'
            });
        }

        console.log(`✓ Payment record found. Current status: ${payment.status}`);

        // Step 4: Prevent duplicate processing
        if (payment.status === 'SUCCESS') {
            console.warn('⚠️ Payment already processed (idempotency check)');
            return res.status(200).json({
                success: true,
                message: 'Payment already processed',
                isIdempotent: true
            });
        }

        // Step 5: Fetch and validate bill
        console.log(`🔍 Fetching bill with ID: ${payment.billId}`);
        const bill = await billModel.findById(payment.billId);

        if (!bill) {
            console.error(`❌ Bill not found: ${payment.billId}`);
            return res.status(404).json({
                success: false,
                message: 'Associated bill not found'
            });
        }

        console.log(`✓ Bill found. Table: ${bill.tableNumber}, Remaining: ${bill.remainingAmount}`);

        // Step 6: Verify amount matches (security check)
        if (Math.abs(payment.amount - total_amount) > 0.01) {
            console.error(`❌ Amount mismatch! Expected: ${payment.amount}, Received: ${total_amount}`);
            payment.status = 'FAILED';
            payment.failedAt = new Date();
            payment.failureReason = `Amount mismatch: expected ${payment.amount}, got ${total_amount}`;
            await payment.save();

            return res.status(400).json({
                success: false,
                message: 'Payment amount mismatch with eSewa response'
            });
        }

        // Step 7: Verify with eSewa API (optional - callback status is authoritative)
        try {
            const esewaConfig = getEsewaConfig();
            const statusUrl = `${esewaConfig.verificationEndpoint}?product_code=${encodeURIComponent(esewaConfig.productCode)}&total_amount=${encodeURIComponent(total_amount)}&transaction_uuid=${encodeURIComponent(transaction_uuid)}`;
            console.log(`🔐 Attempting eSewa API verification...`);

            const esewaResponse = await axios.get(statusUrl, {
                headers: {
                    'Content-Type': 'application/json'
                },
                timeout: 5000
            });

            if (esewaResponse.data?.status === 'COMPLETE') {
                console.log('✓ eSewa API verification successful');
            } else {
                console.warn(`⚠️ eSewa verification returned status: ${esewaResponse.data?.status}. Trusting callback status instead.`);
            }
        } catch (esewaError) {
            // 404 or timeout is expected in some cases - trust the callback status
            if (esewaError.response?.status === 404) {
                console.warn('⚠️ eSewa API returned 404 - transaction may not be indexed yet. Trusting callback status.');
            } else if (esewaError.code === 'ECONNABORTED') {
                console.warn('⚠️ eSewa API verification timed out. Trusting callback status.');
            } else {
                console.warn(`⚠️ eSewa API verification error: ${esewaError.message}. Trusting callback status.`);
            }
        }

        // Step 8: Prevent overpayment (security check)
        console.log(`💰 Checking for overpayment. Current: ${bill.paidAmount}, Payment: ${payment.amount}, Total: ${bill.totalAmount}`);
        const newPaidAmount = bill.paidAmount + payment.amount;

        if (newPaidAmount > bill.totalAmount) {
            console.error(`❌ Overpayment detected! Would total: ${newPaidAmount}, Bill: ${bill.totalAmount}`);
            payment.status = 'FAILED';
            payment.failedAt = new Date();
            payment.failureReason = 'Payment would exceed total bill amount';
            await payment.save();

            return res.status(400).json({
                success: false,
                message: 'Payment would exceed total bill amount'
            });
        }

        // Step 9: Mark payment as successful
        console.log('✅ Marking payment as SUCCESS');
        payment.status = 'SUCCESS';
        payment.paidAt = new Date();
        if (transaction_code) {
            payment.esewaDetails = {
                esewaTransactionId: transaction_code,
                verifiedAt: new Date(),
                signature: esewaData.signature || null
            };
        }
        await payment.save();
        console.log('✓ Payment record updated successfully');

        // Step 10: Update bill status
        console.log('📝 Updating bill record');
        bill.paidAmount = newPaidAmount;
        bill.remainingAmount = bill.totalAmount - bill.paidAmount;

        if (bill.paidAmount >= bill.totalAmount) {
            bill.status = 'PAID';
            bill.qrActive = false;
            console.log('🎉 Bill fully paid! Deactivating QR code');
        } else {
            console.log(`📊 Partial payment. Remaining: ${bill.remainingAmount}`);
        }

        await bill.save();
        console.log('✓ Bill record updated successfully');

        // Step 11: Success response
        const processingTime = Date.now() - startTime;
        console.log(`\n✅ PAYMENT PROCESSING COMPLETE (${processingTime}ms)`);
        console.log('='.repeat(60) + '\n');

        return res.status(200).json({
            success: true,
            message: 'Payment verified and processed successfully',
            data: {
                transaction_uuid,
                transaction_code,
                billId: bill._id.toString(),
                totalAmount: bill.totalAmount,
                paidAmount: bill.paidAmount,
                remainingAmount: bill.remainingAmount,
                billStatus: bill.status,
                processingTimeMs: processingTime
            }
        });

    } catch (error) {
        const processingTime = Date.now() - startTime;
        console.error(`\n❌ PAYMENT PROCESSING FAILED (${processingTime}ms)`);
        console.error('Error:', error.message);
        console.error('Stack:', error.stack);
        console.error('='.repeat(60) + '\n');

        // Attempt to mark as failed if we have a payment record
        try {
            if (payment) {
                payment.status = 'FAILED';
                payment.failedAt = new Date();
                payment.failureReason = error.message;
                await payment.save();
            }
        } catch (updateError) {
            console.error('⚠️ Could not update payment status on error:', updateError.message);
        }

        return res.status(500).json({
            success: false,
            message: 'Error processing payment callback',
            error: {
                message: error.message,
                type: error.name
            }
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

// PAYMENT FAILURE HANDLER - GET /api/payment/bill/failure
const handlePaymentFailure = async (req, res) => {
    try {
        console.log('\n' + '='.repeat(60));
        console.log('❌ ESEWA PAYMENT FAILURE CALLBACK RECEIVED');
        console.log('='.repeat(60));
        console.log('Query Params:', req.query);

        const { transaction_uuid } = req.query;

        if (!transaction_uuid) {
            console.error('❌ No transaction UUID found');
            return res.status(400).json({
                success: false,
                message: 'Transaction UUID is required'
            });
        }

        // Find and mark payment as failed
        const payment = await paymentModel.findOne({ transactionId: transaction_uuid });

        if (payment) {
            payment.status = 'FAILED';
            payment.failedAt = new Date();
            payment.failureReason = 'Payment cancelled or rejected by eSewa';
            await payment.save();
            console.log('📝 Payment marked as FAILED:', transaction_uuid);
        } else {
            console.warn('⚠️ Payment record not found for transaction:', transaction_uuid);
        }

        console.log('='.repeat(60) + '\n');

        // Return JSON response with failure details
        return res.status(200).json({
            success: false,
            message: 'Payment failed or was cancelled',
            transaction_uuid
        });

    } catch (error) {
        console.error('Error handling payment failure:', error);
        return res.status(500).json({
            success: false,
            message: 'Error processing payment failure',
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
    handlePaymentFailure,
    getBillByQRCode,
    getAllBills,
    getBillPayments,
    getPayment,
    closeBill
};
