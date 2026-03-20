# Walk-In Backend API Testing Guide

## Prerequisites

- Backend running: `npm start` on port 4000
- MongoDB connection active
- Postman/Insomnia OR curl installed
- eSewa Test Account credentials

---

## 🧪 Complete Test Flow

### Step 1: Create a Walk-In Session

When a customer scans the QR code, this endpoint creates a new session.

```bash
curl -X POST http://localhost:4000/api/walkin/session/create \
  -H "Content-Type: application/json" \
  -d '{
    "tableNumber": "5",
    "items": [
      {
        "name": "Momos",
        "price": 250,
        "quantity": 2
      },
      {
        "name": "Tea",
        "price": 50,
        "quantity": 1
      }
    ],
    "totalBillAmount": 550
  }'
```

**Expected Response:**
```json
{
  "success": true,
  "message": "Session created successfully",
  "data": {
    "sessionId": "WALKIN-1710000000000-abc123def",
    "tableNumber": "5",
    "totalBillAmount": 550
  }
}
```

**Save the `sessionId` for next steps** ➡️ `WALKIN-1710000000000-abc123def`

---

### Step 2: Get Session Details

Retrieve the current session status and payment history.

```bash
curl http://localhost:4000/api/walkin/session/WALKIN-1710000000000-abc123def
```

**Expected Response:**
```json
{
  "success": true,
  "data": {
    "sessionId": "WALKIN-1710000000000-abc123def",
    "tableNumber": "5",
    "totalBillAmount": 550,
    "totalPaidAmount": 0,
    "remainingBalance": 550,
    "status": "active",
    "paymentHistory": []
  }
}
```

---

### Step 3: Initiate First Payment

Customer decides to pay 300 NPR (partial payment).

```bash
curl -X POST http://localhost:4000/api/walkin/payment/initiate \
  -H "Content-Type: application/json" \
  -d '{
    "sessionId": "WALKIN-1710000000000-abc123def",
    "amount": 300,
    "successUrl": "http://localhost:5173/walkin/payment/success",
    "failureUrl": "http://localhost:5173/walkin/payment/failure"
  }'
```

**Expected Response:**
```json
{
  "success": true,
  "esewaUrl": "https://rc-epay.esewa.com.np/api/epay/main/v2/form",
  "esewaParams": {
    "amount": "300.00",
    "failure_url": "http://localhost:5173/walkin/payment/failure?sessionId=WALKIN-1710000000000-abc123def&paymentId=uuid-xxx",
    "product_code": "EPAYTEST",
    "product_service_charge": "0",
    "product_delivery_charge": "0",
    "success_url": "http://localhost:5173/walkin/payment/success?sessionId=WALKIN-1710000000000-abc123def&paymentId=uuid-xxx&transactionUuid=uuid-yyy",
    "tax_amount": "0",
    "total_amount": "300.00",
    "transaction_uuid": "uuid-yyy",
    "signature": "base64-encoded-signature"
  },
  "paymentId": "uuid-xxx",
  "transactionUuid": "uuid-yyy"
}
```

**Save:**
- `transactionUuid` ➡️ `uuid-yyy`
- `paymentId` ➡️ `uuid-xxx`

---

### Step 4: Verify Payment (After eSewa Callback)

eSewa redirects to success URL with these query params. Verify the payment:

```bash
curl "http://localhost:4000/api/walkin/payment/verify?sessionId=WALKIN-1710000000000-abc123def&transactionUuid=uuid-yyy&oid=oid-from-esewa&refId=ref-from-esewa&amount=300"
```

**Expected Response (Success):**
```json
{
  "success": true,
  "message": "Payment verified successfully",
  "data": {
    "sessionId": "WALKIN-1710000000000-abc123def",
    "paymentId": "uuid-xxx",
    "status": "success",
    "amountPaid": 300,
    "totalPaidAmount": 300,
    "remainingBalance": 250,
    "sessionStatus": "awaiting_payment"
  }
}
```

---

### Step 5: Check Updated Session Status

```bash
curl http://localhost:4000/api/walkin/session/WALKIN-1710000000000-abc123def
```

**Expected Response:**
```json
{
  "success": true,
  "data": {
    "sessionId": "WALKIN-1710000000000-abc123def",
    "tableNumber": "5",
    "totalBillAmount": 550,
    "totalPaidAmount": 300,
    "remainingBalance": 250,
    "status": "awaiting_payment",
    "paymentHistory": [
      {
        "paymentId": "uuid-xxx",
        "transactionUuid": "uuid-yyy",
        "amountPaid": 300,
        "status": "success",
        "esewaRefId": "ref-from-esewa",
        "createdAt": "2024-03-10T10:30:00Z"
      }
    ]
  }
}
```

---

### Step 6: Make Another Payment (Split Pay)

Customer pays remaining 250 NPR (or another amount).

```bash
curl -X POST http://localhost:4000/api/walkin/payment/initiate \
  -H "Content-Type: application/json" \
  -d '{
    "sessionId": "WALKIN-1710000000000-abc123def",
    "amount": 250,
    "successUrl": "http://localhost:5173/walkin/payment/success",
    "failureUrl": "http://localhost:5173/walkin/payment/failure"
  }'
```

**Important:** Notice the response includes a **NEW transactionUuid** (different from first payment)

```json
{
  "success": true,
  "esewaParams": {
    "transaction_uuid": "uuid-zzz",  // ⚠️ DIFFERENT from first payment
    ...
  },
  "transactionUuid": "uuid-zzz"
}
```

---

### Step 7: Verify Second Payment

```bash
curl "http://localhost:4000/api/walkin/payment/verify?sessionId=WALKIN-1710000000000-abc123def&transactionUuid=uuid-zzz&oid=oid2&refId=ref2&amount=250"
```

**Expected Response:**
```json
{
  "success": true,
  "message": "Payment verified successfully",
  "data": {
    "sessionId": "WALKIN-1710000000000-abc123def",
    "status": "success",
    "amountPaid": 250,
    "totalPaidAmount": 550,
    "remainingBalance": 0,
    "sessionStatus": "fully_paid"  // ⚠️ Status changed!
  }
}
```

---

### Step 8: Check Final Session Status

```bash
curl http://localhost:4000/api/walkin/session/WALKIN-1710000000000-abc123def
```

**Expected Response:**
```json
{
  "success": true,
  "data": {
    "sessionId": "WALKIN-1710000000000-abc123def",
    "tableNumber": "5",
    "totalBillAmount": 550,
    "totalPaidAmount": 550,
    "remainingBalance": 0,
    "status": "fully_paid",
    "paymentHistory": [
      {
        "paymentId": "uuid-xxx",
        "transactionUuid": "uuid-yyy",
        "amountPaid": 300,
        "status": "success",
        "esewaRefId": "ref-from-esewa",
        "createdAt": "2024-03-10T10:30:00Z"
      },
      {
        "paymentId": "uuid-aaa",
        "transactionUuid": "uuid-zzz",
        "amountPaid": 250,
        "status": "success",
        "esewaRefId": "ref2-from-esewa",
        "createdAt": "2024-03-10T10:35:00Z"
      }
    ]
  }
}
```

---

## ❌ Error Cases & Expected Responses

### Error 1: Invalid Session ID
```bash
curl http://localhost:4000/api/walkin/session/INVALID-ID
```

**Response:**
```json
{
  "success": false,
  "message": "Session not found"
}
```

---

### Error 2: Payment Amount Exceeds Remaining Balance
```bash
curl -X POST http://localhost:4000/api/walkin/payment/initiate \
  -H "Content-Type: application/json" \
  -d '{
    "sessionId": "WALKIN-1710000000000-abc123def",
    "amount": 600
  }'
```

**Response (if remaining balance is only 250):**
```json
{
  "success": false,
  "message": "Payment amount exceeds remaining balance (250.00 NPR)"
}
```

---

### Error 3: Missing Required Fields
```bash
curl -X POST http://localhost:4000/api/walkin/session/create \
  -H "Content-Type: application/json" \
  -d '{
    "tableNumber": "5"
  }'
```

**Response:**
```json
{
  "success": false,
  "message": "Valid total bill amount is required"
}
```

---

### Error 4: Payment Verification - Invalid Transaction UUID
```bash
curl "http://localhost:4000/api/walkin/payment/verify?sessionId=WALKIN-1710000000000-abc123def&transactionUuid=invalid-uuid"
```

**Response:**
```json
{
  "success": false,
  "message": "Payment record not found"
}
```

---

### Error 5: Payment Failure Callback
```bash
curl "http://localhost:4000/api/walkin/payment/failure?sessionId=WALKIN-1710000000000-abc123def&transactionUuid=uuid-yyy"
```

**Response:**
```json
{
  "success": false,
  "message": "Payment failed",
  "sessionId": "WALKIN-1710000000000-abc123def"
}
```

---

## 🔄 API Endpoint Summary

| Method | Endpoint | Purpose | Key Param |
|--------|----------|---------|-----------|
| POST | `/api/walkin/session/create` | Create new session | - |
| GET | `/api/walkin/session/:sessionId` | Get session details | `sessionId` |
| POST | `/api/walkin/payment/initiate` | Start payment | `sessionId`, `amount` |
| GET | `/api/walkin/payment/verify` | Verify payment | `sessionId`, `transactionUuid` |
| GET | `/api/walkin/payment/failure` | Handle failure | `sessionId`, `transactionUuid` |

---

## 📊 Request/Response Pattern

### All Requests:
- `Content-Type: application/json`
- Method: GET or POST (as specified)

### All Responses:
```json
{
  "success": true|false,
  "message": "Human readable message",
  "data": { ... } // Only if successful
}
```

---

## 🧩 Integration Points

### Frontend Needs:
1. **Session Creation**: POST to `/api/walkin/session/create` when QR scanned
2. **Display Balance**: GET `/api/walkin/session/:sessionId` to show remaining
3. **Payment Form**: POST to `/api/walkin/payment/initiate` when user enters amount
4. **Handle Redirect**: Let eSewa redirect to success/failure URLs
5. **Verification**: GET `/api/walkin/payment/verify` to confirm payment
6. **Show Status**: GET `/api/walkin/session/:sessionId` to display updated balance

### Key Variables to Save:
- `sessionId` - From session creation
- `transactionUuid` - From payment initiation
- `paymentId` - From payment initiation
- Return from eSewa: `oid`, `refId`, `amount`

---

## 🐛 Debugging Tips

### Check if session exists:
```bash
curl http://localhost:4000/api/walkin/session/YOUR_SESSION_ID
```

### Monitor MongoDB (if using MongoDB Shell):
```javascript
db.walkinSessions.findOne({ sessionId: "WALKIN-..." });
```

### Check payment history:
```javascript
db.walkinSessions.findOne(
  { sessionId: "WALKIN-..." },
  { payments: 1 }
);
```

### Verify eSewa configuration:
Check `.env` file for:
```
ESEWA_ENV=sandbox
ESEWA_PRODUCT_CODE=EPAYTEST
ESEWA_SECRET_KEY=8gBm/:&EnhH.1/q
```

---

✅ **Ready to Test!**
Start with Step 1 and follow through the complete flow.
