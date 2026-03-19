# QR-Based Split Payment System - Backend Implementation Guide

## Overview
Complete MERN stack implementation for QR-based split bill payments using eSewa sandbox API. Multiple customers can scan the same QR code and pay partial amounts until the bill is fully paid.

---

## API ENDPOINTS

### 1. CREATE BILL API
**Endpoint:** `POST /api/bills/create`

**Request Body:**
```json
{
  "tableNumber": 5,
  "totalAmount": 1000
}
```

**Response (201 Created):**
```json
{
  "billId": "507f1f77bcf86cd799439011",
  "paymentUrl": "/api/pay/507f1f77bcf86cd799439011"
}
```

**Business Logic:**
- Creates a new bill with status "UNPAID"
- Generates unique QR code data
- Sets paidAmount to 0
- Sets remainingAmount to totalAmount
- Sets qrActive to true

---

### 2. GET BILL DETAILS
**Endpoint:** `GET /api/bills/:billId`

**Response (200 OK):**
```json
{
  "totalAmount": 1000,
  "paidAmount": 500,
  "remainingAmount": 500,
  "status": "UNPAID"
}
```

**Example:**
```
GET /api/bills/507f1f77bcf86cd799439011
```

---

### 3. INITIATE ESEWA PAYMENT
**Endpoint:** `POST /api/payment/esewa/initiate`

**Request Body:**
```json
{
  "billId": "507f1f77bcf86cd799439011",
  "amount": 200
}
```

**Validation:**
- amount > 0 ✓
- amount <= remainingAmount ✓
- bill.status must be "UNPAID" ✓

**Response (200 OK):**
```json
{
  "amount": 200,
  "tax_amount": 0,
  "total_amount": 200,
  "transaction_uuid": "507f1f77bcf86cd799439011_1710508800000_a1b2c3d4",
  "product_code": "EPAYTEST",
  "product_name": "Table 5 Bill Payment",
  "success_url": "http://localhost:4000/api/payment/success?transaction_uuid=...",
  "failure_url": "http://localhost:4000/api/payment/failure?transaction_uuid=...",
  "signed_field_names": "total_amount,transaction_uuid,product_code",
  "signature": "rTKJJeL5yqwJnUYU4j5bUqN0r5Z8q7y5z5Z5Q5Q5Q5Q=",
  "paymentEndpoint": "https://rc-epay.esewa.com.np/api/epay/main/v2/form"
}
```

**Frontend Implementation:**
```html
<form method="POST" action="https://rc-epay.esewa.com.np/api/epay/main/v2/form">
  <input type="hidden" name="amount" value="200" />
  <input type="hidden" name="tax_amount" value="0" />
  <input type="hidden" name="total_amount" value="200" />
  <input type="hidden" name="transaction_uuid" value="..." />
  <input type="hidden" name="product_code" value="EPAYTEST" />
  <input type="hidden" name="product_name" value="Table 5 Bill Payment" />
  <input type="hidden" name="success_url" value="..." />
  <input type="hidden" name="failure_url" value="..." />
  <input type="hidden" name="signed_field_names" value="total_amount,transaction_uuid,product_code" />
  <input type="hidden" name="signature" value="..." />
  <button type="submit">Pay with eSewa</button>
</form>
```

---

### 4. PAYMENT SUCCESS VERIFICATION
**Endpoint:** `GET /api/payment/success`

**Query Parameters:**
- `transaction_uuid` (required)
- `status` (from eSewa)
- `transaction_code` (from eSewa)

**Example:**
```
GET /api/payment/success?transaction_uuid=507f1f77bcf86cd799439011_1710508800000_a1b2c3d4&status=COMPLETE&transaction_code=0051PQV
```

**Backend Logic:**
1. ✓ Verify payment with eSewa verification API
2. ✓ Create/Update Payment record
3. ✓ Update bill: `bill.paidAmount += paymentAmount`
4. ✓ Calculate: `bill.remainingAmount = totalAmount - paidAmount`
5. ✓ If paidAmount >= totalAmount:
   - Set bill.status = "PAID"
   - Set bill.qrActive = false
   - Disable further payments
6. ✓ Prevent duplicate transactions
7. ✓ Prevent overpayment

**Response (200 OK - Payment Successful):**
```json
{
  "success": true,
  "message": "Payment verified and processed successfully",
  "data": {
    "billId": "507f1f77bcf86cd799439011",
    "totalAmount": 1000,
    "paidAmount": 700,
    "remainingAmount": 300,
    "status": "UNPAID"
  }
}
```

**Response (200 OK - Bill Fully Paid):**
```json
{
  "success": true,
  "message": "Payment verified and processed successfully",
  "data": {
    "billId": "507f1f77bcf86cd799439011",
    "totalAmount": 1000,
    "paidAmount": 1000,
    "remainingAmount": 0,
    "status": "PAID"
  }
}
```

**Response (400 Bad Request - Payment Failed):**
```json
{
  "success": false,
  "message": "Payment verification failed: transaction not completed"
}
```

---

## DATABASE SCHEMAS

### Bill Schema
```javascript
{
  tableNumber: Number,           // Table identifier
  totalAmount: Number,           // Total bill amount
  paidAmount: Number,            // Amount received so far (default: 0)
  remainingAmount: Number,       // Automatic: totalAmount - paidAmount
  status: String,                // "UNPAID" | "PAID" (default: "UNPAID")
  qrActive: Boolean,             // Active for payments (default: true)
  qrCodeData: String,            // Unique QR identifier
  createdAt: Date,               // Timestamp
  updatedAt: Date                // Auto-updated
}
```

### Payment Schema
```javascript
{
  billId: ObjectId,              // Reference to Bill
  amount: Number,                // Payment amount
  method: String,                // "esewa" | "cash" | "card" (default: "esewa")
  transactionId: String,         // Unique transaction identifier
  status: String,                // "PENDING" | "SUCCESS" | "FAILED" (default: "PENDING")
  esewaDetails: {
    esewaTransactionId: String,  // eSewa transaction code
    productCode: String,
    productName: String,
    // ... other eSewa details
  },
  customerPhone: String,         // Optional customer info
  customerName: String,
  paidAt: Date,                  // Payment success timestamp
  failedAt: Date,                // Payment failure timestamp
  failureReason: String,         // Why payment failed
  createdAt: Date,
  updatedAt: Date
}
```

---

## SPLIT PAYMENT EXAMPLE

### Initial State
```
Bill ID: bill_123
Table: 5
Total Amount: NPR 1000
Status: UNPAID
QR Active: true
```

### Payment Sequence

**Customer A pays NPR 200:**
- POST /api/payment/esewa/initiate { billId: "bill_123", amount: 200 }
- eSewa redirects to success
- GET /api/payment/success?transaction_uuid=...&status=COMPLETE
- Bill Updated:
  - paidAmount = 200
  - remainingAmount = 800
  - status = "UNPAID"
  - qrActive = true (still accepting payments)

**Customer B pays NPR 300:**
- POST /api/payment/esewa/initiate { billId: "bill_123", amount: 300 }
- GET /api/payment/success?transaction_uuid=...&status=COMPLETE
- Bill Updated:
  - paidAmount = 500
  - remainingAmount = 500
  - status = "UNPAID"
  - qrActive = true

**Customer C pays NPR 500:**
- POST /api/payment/esewa/initiate { billId: "bill_123", amount: 500 }
- GET /api/payment/success?transaction_uuid=...&status=COMPLETE
- Bill Updated:
  - paidAmount = 1000
  - remainingAmount = 0
  - status = "PAID" ✓ (Bill fully paid!)
  - qrActive = false (QR deactivated)

**Any further payment attempts will be rejected:**
```
Error: "Bill must be in UNPAID status"
or
Error: "This bill is no longer accepting payments"
```

---

## ADDITIONAL HELPER ENDPOINTS

### Get All Bills
**GET** `/api/bills/list?status=UNPAID&page=1&limit=10`

### Get Bill by QR Code
**GET** `/api/bills/qr/:qrCodeData`

### Get All Payments for a Bill
**GET** `/api/bills/:billId/payments`

### Get Specific Payment
**GET** `/api/bills/payment/:paymentId`

### Close a Bill
**POST** `/api/bills/:billId/close`

### Payment Failure Callback
**GET** `/api/payment/failure?transaction_uuid=...`

---

## ENVIRONMENT VARIABLES

Add these to your `.env` file:

```env
# MongoDB
MONGODB_URL=mongodb+srv://username:password@cluster.mongodb.net/?appName=...

# JWT
JWT_SECRET=your_secret_key

# eSewa Configuration
ESEWA_ENV=sandbox
ESEWA_PRODUCT_CODE=EPAYTEST
ESEWA_SECRET_KEY=8gBm/:&EnhH.1/q

# Server Configuration
PORT=4000
BACKEND_URL=http://localhost:4000
NODE_ENV=production
```

---

## INSTALLATION & SETUP

### 1. Install Dependencies
```bash
cd Development/Backend
npm install axios
npm install
```

### 2. Verify Files Created
- ✓ models/billModel.js
- ✓ models/paymentModel.js
- ✓ controllers/billController.js
- ✓ routes/billRoute.js

### 3. Update server.js
Already updated with:
- Import billRouter
- Register /api/bills route

### 4. Start Backend
```bash
npm run server
```

---

## TESTING WITH POSTMAN

### Test 1: Create Bill
```
POST http://localhost:4000/api/bills/create
Body: {
  "tableNumber": 5,
  "totalAmount": 1000
}
```
Save the returned `billId` for next tests.

### Test 2: Get Bill Details
```
GET http://localhost:4000/api/bills/{billId}
```

### Test 3: Initiate Payment
```
POST http://localhost:4000/api/payment/esewa/initiate
Body: {
  "billId": "{billId}",
  "amount": 200
}
```
Save the `transaction_uuid` for next test.

### Test 4: Verify Payment (Sandbox)
Open eSewa sandbox payment page and complete the test payment.
eSewa will redirect to your success_url with query parameters.

Or simulate locally:
```
GET http://localhost:4000/api/payment/success?transaction_uuid={transaction_uuid}&status=COMPLETE&transaction_code=0051PQV
```

### Test 5: Check Bill Status
```
GET http://localhost:4000/api/bills/{billId}
```
You should see `paidAmount: 200` and `remainingAmount: 800`

---

## ERROR HANDLING

### Bill Not Found
```json
{
  "success": false,
  "message": "Bill not found"
}
```

### Invalid Amount
```json
{
  "success": false,
  "message": "Amount cannot exceed remaining amount (800)"
}
```

### Bill Already Paid
```json
{
  "success": false,
  "message": "Bill must be in UNPAID status"
}
```

### Duplicate Payment
```json
{
  "success": false,
  "message": "Payment already processed"
}
```

### eSewa Verification Failed
```json
{
  "success": false,
  "message": "Error verifying with eSewa",
  "error": "..."
}
```

---

## FEATURES IMPLEMENTED

✅ Multiple split payments from different customers  
✅ Automatic bill status updates  
✅ QR code deactivation on full payment  
✅ eSewa sandbox integration with signature generation  
✅ Payment verification with eSewa API  
✅ Duplicate transaction prevention  
✅ Overpayment prevention  
✅ Complete audit trail  
✅ Transaction timestamps  
✅ Error handling and validation  
✅ Mongoose schema validation  

---

## NEXT STEPS

1. **Frontend QR Code Scanner:** Implement QR code scanning in React
2. **Payment UI:** Create payment form for customers
3. **Admin Dashboard:** Display bills and payment history
4. **Notifications:** Real-time updates when bill is paid
5. **Analytics:** Track payment trends and revenue
6. **Refunds:** Handle partial refunds if needed

