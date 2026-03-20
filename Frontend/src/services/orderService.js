import axios from 'axios';

const API_URL = 'http://localhost:4000/api';

// Initiate eSewa payment for order
export const initiateOrderPayment = async (orderId, amount, token) => {
    try {
        console.log('📤 Initiating eSewa payment for order:', { orderId, amount });

        const payload = {
            orderId,
            amount: parseFloat(amount)
        };

        console.log('Sending payload:', payload);

        const response = await axios.post(`${API_URL}/payment/order/esewa/initiate`, payload, {
            headers: { token }
        });

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
        throw error.response?.data || { success: false, message: error.message || 'Error initiating payment' };
    }
};
