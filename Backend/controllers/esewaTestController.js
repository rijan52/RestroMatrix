import crypto from "crypto";
import orderModel from "../models/orderModel.js";
import customerModel from "../models/customerModel.js";

const MIN_TEST_CHARGE_NPR = 1; // Lower minimum for testing

const getEsewaConfig = () => {
    const env = process.env.ESEWA_ENV || "sandbox";
    const endpoint = env === "live"
        ? "https://epay.esewa.com.np/api/epay/main/v2/form"
        : "https://rc-epay.esewa.com.np/api/epay/main/v2/form";
    const statusEndpoint = env === "live"
        ? "https://epay.esewa.com.np/api/epay/transaction/status/"
        : "https://rc-epay.esewa.com.np/api/epay/transaction/status/";

    return {
        env,
        endpoint,
        statusEndpoint,
        productCode: process.env.ESEWA_PRODUCT_CODE || "EPAYTEST",
        secretKey: process.env.ESEWA_SECRET_KEY || "8gBm/:&EnhH.1/q"
    };
};

const formatAmount = (amount) => Number(amount).toFixed(2);

const signEsewaPayload = ({ total_amount, transaction_uuid, product_code }, secretKey) => {
    const message = `total_amount=${total_amount},transaction_uuid=${transaction_uuid},product_code=${product_code}`;
    return crypto
        .createHmac("sha256", secretKey)
        .update(message)
        .digest("base64");
};

// Generate test payment payload without creating an order
const generateTestPayload = async (req, res) => {
    try {
        const { amount, tax_amount = "0", service_charge = "0", delivery_charge = "0" } = req.body;

        if (!amount || Number(amount) < MIN_TEST_CHARGE_NPR) {
            return res.json({
                success: false,
                message: `Test minimum amount is Rs ${MIN_TEST_CHARGE_NPR}`
            });
        }

        const itemAmount = formatAmount(amount);
        const taxAmount = formatAmount(tax_amount);
        const serviceCharge = formatAmount(service_charge);
        const deliveryCharge = formatAmount(delivery_charge);

        const totalAmount = formatAmount(
            parseFloat(itemAmount) +
            parseFloat(taxAmount) +
            parseFloat(serviceCharge) +
            parseFloat(deliveryCharge)
        );

        // Generate a test transaction UUID
        const testTransactionUUID = `TEST-${Date.now()}-${Math.random().toString(36).substring(7).toUpperCase()}`;

        const esewaConfig = getEsewaConfig();

        const paymentPayload = {
            amount: itemAmount,
            tax_amount: taxAmount,
            total_amount: totalAmount,
            transaction_uuid: testTransactionUUID,
            product_code: esewaConfig.productCode,
            product_name: "RestroMatrix Test Payment",
            product_service_charge: serviceCharge,
            product_delivery_charge: deliveryCharge,
            success_url: `${process.env.BACKEND_URL || "http://localhost:4000"}/api/esewa-test/success?transaction_uuid=${encodeURIComponent(testTransactionUUID)}`,
            failure_url: `${process.env.BACKEND_URL || "http://localhost:4000"}/api/esewa-test/failure?transaction_uuid=${encodeURIComponent(testTransactionUUID)}`,
            signed_field_names: "total_amount,transaction_uuid,product_code"
        };

        const signature = signEsewaPayload(
            {
                total_amount: paymentPayload.total_amount,
                transaction_uuid: paymentPayload.transaction_uuid,
                product_code: paymentPayload.product_code
            },
            esewaConfig.secretKey
        );

        // Debug logging
        const signatureMessage = `total_amount=${paymentPayload.total_amount},transaction_uuid=${paymentPayload.transaction_uuid},product_code=${paymentPayload.product_code}`;
        console.log("\n=== Test eSewa Payment Debug Info ===");
        console.log("Product Code:", paymentPayload.product_code);
        console.log("Secret Key:", esewaConfig.secretKey);
        console.log("Signature Message:", signatureMessage);
        console.log("Signature:", signature);
        console.log("Transaction UUID:", testTransactionUUID);
        console.log("Amount:", itemAmount);
        console.log("Total Amount:", totalAmount);
        console.log("====================================\n");

        res.json({
            success: true,
            message: "Test payment payload generated",
            payment: {
                endpoint: esewaConfig.endpoint,
                params: {
                    amount: paymentPayload.amount,
                    tax_amount: paymentPayload.tax_amount,
                    total_amount: paymentPayload.total_amount,
                    transaction_uuid: paymentPayload.transaction_uuid,
                    product_code: paymentPayload.product_code,
                    product_name: paymentPayload.product_name,
                    product_service_charge: paymentPayload.product_service_charge,
                    product_delivery_charge: paymentPayload.product_delivery_charge,
                    success_url: paymentPayload.success_url,
                    failure_url: paymentPayload.failure_url,
                    signed_field_names: paymentPayload.signed_field_names,
                    signature: signature
                }
            }
        });
    } catch (error) {
        console.error("Test payload generation error:", error);
        res.json({
            success: false,
            message: error?.message || "Error generating test payload"
        });
    }
};

// Mock success response for testing
const testPaymentSuccess = (req, res) => {
    const { transaction_uuid } = req.query;
    console.log("Test Payment Success - UUID:", transaction_uuid);
    res.json({
        success: true,
        message: "Test payment successful",
        transaction_uuid,
        status: "COMPLETE"
    });
};

// Mock failure response for testing
const testPaymentFailure = (req, res) => {
    const { transaction_uuid } = req.query;
    console.log("Test Payment Failure - UUID:", transaction_uuid);
    res.json({
        success: false,
        message: "Test payment failed",
        transaction_uuid,
        status: "FAILED"
    });
};

// Verify test payment (simulates eSewa status check)
const verifyTestPayment = async (req, res) => {
    try {
        const { transaction_uuid, total_amount } = req.body;

        if (!transaction_uuid) {
            return res.json({
                success: false,
                message: "Missing transaction UUID"
            });
        }

        // Mock successful verification for test transactions
        console.log("Verifying test payment:", transaction_uuid);
        
        res.json({
            success: true,
            message: "Test payment verified",
            data: {
                transaction_uuid,
                status: "COMPLETE",
                total_amount,
                ref_id: `TEST-${Date.now()}`
            }
        });
    } catch (error) {
        console.error("Test payment verification error:", error);
        res.json({
            success: false,
            message: error?.message || "Error verifying test payment"
        });
    }
};

// Get test credentials
const getTestCredentials = (req, res) => {
    const esewaConfig = getEsewaConfig();
    
    res.json({
        success: true,
        credentials: {
            productCode: esewaConfig.productCode,
            endpoint: esewaConfig.endpoint,
            environment: esewaConfig.env,
            testAmount: "100.00",
            minimumAmount: String(MIN_TEST_CHARGE_NPR)
        },
        instructions: {
            step1: "Generate a test payload using POST /api/esewa-test/generate-payload",
            step2: "Use the response to create a payment form",
            step3: "Submit the form to the eSewa endpoint",
            step4: "You'll be redirected to success/failure URL",
            step5: "In production, verify payment via POST /api/esewa-test/verify"
        }
    });
};

export {
    generateTestPayload,
    testPaymentSuccess,
    testPaymentFailure,
    verifyTestPayment,
    getTestCredentials
};
