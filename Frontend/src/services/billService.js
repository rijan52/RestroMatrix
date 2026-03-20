import axios from 'axios';

const API_URL = 'http://localhost:4000/api';

// Get bill details
export const getBill = async (billId) => {
    try {
        const response = await axios.get(`${API_URL}/bills/${billId}`);
        return response.data;
    } catch (error) {
        const errorData = error.response?.data;
        if (errorData && typeof errorData === 'object') {
            throw errorData;
        }

        throw {
            success: false,
            message: error.response?.data?.message || error.message || 'Error fetching bill'
        };
    }
};

// Initiate eSewa payment with detailed logging
export const initiateEsewaPayment = async (billId, amount) => {
    try {
        console.log('📤 Initiating eSewa payment:', { billId, amount });

        const payload = {
            billId,
            amount: parseFloat(amount)
        };

        console.log('Sending payload:', payload);

        const response = await axios.post(`${API_URL}/payment/esewa/initiate`, payload);

        console.log('✅ Payment initiation response:', response.data);

        // Validate response contains all required fields
        const requiredFields = [
            'amount', 'tax_amount', 'total_amount', 'transaction_uuid',
            'product_code', 'product_name', 'product_service_charge',
            'product_delivery_charge', 'success_url', 'failure_url',
            'signed_field_names', 'signature', 'paymentEndpoint'
        ];

        const missingFields = requiredFields.filter(field => !response.data[field]);
        if (missingFields.length > 0) {
            console.error('❌ Missing fields in response:', missingFields);
            throw new Error(`Missing required fields: ${missingFields.join(', ')}`);
        }

        // Ensure all values are properly formatted
        const formattedResponse = {
            ...response.data,
            amount: response.data.amount?.toString(),
            tax_amount: response.data.tax_amount?.toString(),
            total_amount: response.data.total_amount?.toString(),
            product_service_charge: response.data.product_service_charge?.toString(),
            product_delivery_charge: response.data.product_delivery_charge?.toString()
        };

        console.log('📋 Formatted response for eSewa form submission:', formattedResponse);

        return formattedResponse;
    } catch (error) {
        console.error('❌ Error initiating payment:', error);
        console.error('Error details:', error.response?.data || error.message);

        // Handle error properly
        const errorData = error.response?.data;
        if (errorData && typeof errorData === 'object') {
            throw errorData;
        }

        throw {
            success: false,
            message: error.response?.data?.message || error.message || 'Error initiating payment'
        };
    }
};

// Get bill by QR code (if needed)
export const getBillByQR = async (qrCodeData) => {
    try {
        const response = await axios.get(`${API_URL}/bills/qr/${qrCodeData}`);
        return response.data;
    } catch (error) {
        const errorData = error.response?.data;
        if (errorData && typeof errorData === 'object') {
            throw errorData;
        }

        throw {
            success: false,
            message: error.response?.data?.message || error.message || 'Error fetching bill'
        };
    }
};

// Get all payments for a bill (for display purposes)
export const getBillPayments = async (billId) => {
    try {
        const response = await axios.get(`${API_URL}/bills/${billId}/payments`);
        return response.data;
    } catch (error) {
        const errorData = error.response?.data;
        if (errorData && typeof errorData === 'object') {
            throw errorData;
        }

        throw {
            success: false,
            message: error.response?.data?.message || error.message || 'Error fetching payments'
        };
    }
};

