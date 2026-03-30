import axios from 'axios';

const API_URL = 'http://localhost:4000/api';

// Create a new bill
export const createBill = async (tableNumber, totalAmount, restaurantId) => {
    try {
        const response = await axios.post(`${API_URL}/bills/create`, {
            tableNumber,
            totalAmount,
            restaurantId
        });
        return response.data;
    } catch (error) {
        throw error.response?.data || { success: false, message: 'Error creating bill' };
    }
};

// Get bill details
export const getBill = async (billId) => {
    try {
        const response = await axios.get(`${API_URL}/bills/${billId}`);
        return response.data;
    } catch (error) {
        throw error.response?.data || { success: false, message: 'Error fetching bill' };
    }
};

// Get all bills
export const getAllBills = async (params = {}) => {
    try {
        const response = await axios.get(`${API_URL}/bills/list`, { params });
        return response.data;
    } catch (error) {
        throw error.response?.data || { success: false, message: 'Error fetching bills' };
    }
};

// Get bill by QR code
export const getBillByQR = async (qrCodeData) => {
    try {
        const response = await axios.get(`${API_URL}/bills/qr/${qrCodeData}`);
        return response.data;
    } catch (error) {
        throw error.response?.data || { success: false, message: 'Error fetching bill' };
    }
};

// Get all payments for a bill
export const getBillPayments = async (billId) => {
    try {
        const response = await axios.get(`${API_URL}/bills/${billId}/payments`);
        return response.data;
    } catch (error) {
        throw error.response?.data || { success: false, message: 'Error fetching payments' };
    }
};

// Close a bill
export const closeBill = async (billId) => {
    try {
        const response = await axios.post(`${API_URL}/bills/${billId}/close`);
        return response.data;
    } catch (error) {
        throw error.response?.data || { success: false, message: 'Error closing bill' };
    }
};
