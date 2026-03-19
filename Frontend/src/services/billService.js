import axios from 'axios';

const API_URL = 'http://localhost:4000/api';

// Get bill details
export const getBill = async (billId) => {
    try {
        const response = await axios.get(`${API_URL}/bills/${billId}`);
        return response.data;
    } catch (error) {
        throw error.response?.data || { success: false, message: 'Error fetching bill' };
    }
};

// Initiate eSewa payment with detailed logging
export const initiateEsewaPayment = async (billId, amount) => {
    try {
        console.log('📤 Initiating eSewa payment:', { billId, amount });

        const payload = {
            billId,
            amount
        };

        console.log('Sending payload:', payload);

        const response = await axios.post(`${API_URL}/payment/esewa/initiate`, payload);

        console.log('✅ Payment initiation response:', response.data);

        if (!response.data.transactionId && response.data.transaction_uuid) {
            response.data.transactionId = response.data.transaction_uuid;
        }

        return response.data;
    } catch (error) {
        console.error('❌ Error initiating payment:', error);
        console.error('Error details:', error.response?.data || error.message);
        throw error.response?.data || { success: false, message: 'Error initiating payment' };
    }
};

// Get bill by QR code (if needed)
export const getBillByQR = async (qrCodeData) => {
    try {
        const response = await axios.get(`${API_URL}/bills/qr/${qrCodeData}`);
        return response.data;
    } catch (error) {
        throw error.response?.data || { success: false, message: 'Error fetching bill' };
    }
};

// Get all payments for a bill (for display purposes)
export const getBillPayments = async (billId) => {
    try {
        const response = await axios.get(`${API_URL}/bills/${billId}/payments`);
        return response.data;
    } catch (error) {
        throw error.response?.data || { success: false, message: 'Error fetching payments' };
    }
};

