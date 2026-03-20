# Walk-In Backend Integration Guide

## Overview
This guide explains how the walk-in (dine-in) payment system has been merged into your main backend while preserving the existing online customer payment flow.

---

## 🎯 Key Separation Points

### Online Payment Flow (UNCHANGED)
- **Routes**: `/api/payment/order/esewa/initiate`, `/api/payment/success`, `/api/payment/failure`
- **Models**: Uses existing `orderModel`, `cartModel`
- **Controllers**: `orderController.js`, `billController.js`
- **Identifier**: `orderId`

### Walk-In Payment Flow (NEW)
- **Routes**: `/api/walkin/session/*`, `/api/walkin/payment/*`
- **Model**: `walkInSessionModel.js` (NEW)
- **Controller**: `walkInPaymentController.js` (NEW)
- **Identifier**: `sessionId` (unique per QR scan)

---

## 📁 New Files Added

```
Backend/
├── models/
│   └── walkInSessionModel.js          ✅ NEW - Stores walk-in sessions & split payments
├── controllers/
│   └── walkInPaymentController.js     ✅ NEW - Handles walk-in payment logic
├── routes/
│   └── walkInRoute.js                 ✅ NEW - Route definitions
└── server.js                          ✏️ MODIFIED - Added walk-in router import
```

---

## 🔑 Important Constraints & Design Decisions

### 1. **Separate Transaction UUIDs**
- Each payment attempt gets a **unique transaction UUID** (`uuidv4()`)
- Prevents duplicate charges if user retries payment
- Stored in: `walkInSessionModel.payments[].transactionUuid`

### 2. **sessionId vs orderId**
- Walk-in: Uses `sessionId` (e.g., `WALKIN-1710000000000-abc123def`)
- Online: Uses `orderId` (MongoDB ObjectId)
- **Never mix these identifiers** - they target different models

### 3. **Split Payments Support**
- One session can have multiple payments
- Track remaining balance: `totalBillAmount - totalPaidAmount`
- Array structure allows payment history

### 4. **No Conflict with Online Payments**
- Walk-in routes: `/api/walkin/*`
- Online routes: `/api/payment/order/*`, `/api/bills/*`
- Different controllers, different models = no interference

---

## 📊 Walk-In Session Model

```javascript
{
  sessionId: "WALKIN-1710000000000-abc123def",  // Unique per QR scan
  tableNumber: "5",
  items: [                                       // What they're paying for
    { foodId: ObjectId, name: "Momos", price: 250, quantity: 1 }
  ],
  totalBillAmount: 1250,                         // Total bill
  payments: [                                    // All payment attempts
    {
      paymentId: "uuid-xxx",
      transactionUuid: "uuid-yyy",              // UNIQUE per payment attempt
      amountPaid: 500,
      status: "success" | "pending" | "failed",
      esewaRefId: "esewa-ref-123",
      createdAt: Date
    }
  ],
  totalPaidAmount: 500,                          // Sum of successful payments
  remainingBalance: 750,                         // Calculated: totalBillAmount - totalPaidAmount
  status: "active" | "awaiting_payment" | "fully_paid" | "closed"
}
```

---

## 🌐 API Endpoints

### Session Management

#### 1. **Create Walk-In Session**
```http
POST /api/walkin/session/create
Content-Type: application/json

{
  "tableNumber": "5",
  "items": [
    {
      "foodId": "507f1f77bcf86cd799439011",
      "name": "Momos",
      "price": 250,
      "quantity": 1
    }
  ],
  "totalBillAmount": 1250
}

Response:
{
  "success": true,
  "data": {
    "sessionId": "WALKIN-1710000000000-abc123def",
    "tableNumber": "5",
    "totalBillAmount": 1250
  }
}
```

#### 2. **Get Session Details**
```http
GET /api/walkin/session/:sessionId

Response:
{
  "success": true,
  "data": {
    "sessionId": "WALKIN-1710000000000-abc123def",
    "tableNumber": "5",
    "totalBillAmount": 1250,
    "totalPaidAmount": 500,
    "remainingBalance": 750,
    "status": "awaiting_payment",
    "paymentHistory": [
      {
        "paymentId": "uuid-xxx",
        "transactionUuid": "uuid-yyy",
        "amountPaid": 500,
        "status": "success",
        "esewaRefId": "esewa-ref-123",
        "createdAt": "2024-03-10T10:30:00Z"
      }
    ]
  }
}
```

### Payment Handling

#### 3. **Initiate Walk-In Payment**
```http
POST /api/walkin/payment/initiate
Content-Type: application/json

{
  "sessionId": "WALKIN-1710000000000-abc123def",
  "amount": 500,
  "successUrl": "http://localhost:5173/walkin/payment/success",
  "failureUrl": "http://localhost:5173/walkin/payment/failure"
}

Response:
{
  "success": true,
  "esewaUrl": "https://rc-epay.esewa.com.np/api/epay/main/v2/form",
  "esewaParams": {
    "amount": "500.00",
    "failure_url": "...",
    "product_code": "EPAYTEST",
    "success_url": "...",
    "total_amount": "500.00",
    "transaction_uuid": "uuid-yyy",
    "signature": "base64-signature"
  },
  "paymentId": "uuid-xxx",
  "transactionUuid": "uuid-yyy"
}
```

#### 4. **Verify Walk-In Payment** (eSewa Callback)
```http
GET /api/walkin/payment/verify?sessionId=WALKIN-...&transactionUuid=uuid-yyy&oid=OID&refId=REF&amount=500

Response (Success):
{
  "success": true,
  "message": "Payment verified successfully",
  "data": {
    "sessionId": "WALKIN-1710000000000-abc123def",
    "status": "success",
    "amountPaid": 500,
    "totalPaidAmount": 500,
    "remainingBalance": 750,
    "sessionStatus": "awaiting_payment"
  }
}
```

#### 5. **Handle Payment Failure**
```http
GET /api/walkin/payment/failure?sessionId=WALKIN-...&transactionUuid=uuid-yyy

Response:
{
  "success": false,
  "message": "Payment failed",
  "sessionId": "WALKIN-1710000000000-abc123def"
}
```

---

## 🚀 Frontend Integration Example (React)

### Step 1: Create Session (When QR is scanned)
```javascript
const handleQRScan = async (qrData) => {
  const response = await fetch('/api/walkin/session/create', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      tableNumber: qrData.tableNumber,
      items: qrData.items,
      totalBillAmount: qrData.totalBillAmount
    })
  });
  
  const data = await response.json();
  setSessionId(data.data.sessionId);
};
```

### Step 2: Get Session Details
```javascript
const fetchSessionDetails = async (sessionId) => {
  const response = await fetch(`/api/walkin/session/${sessionId}`);
  const data = await response.json();
  
  setBill({
    total: data.data.totalBillAmount,
    paid: data.data.totalPaidAmount,
    remaining: data.data.remainingBalance
  });
};
```

### Step 3: Initiate Payment
```javascript
const handlePayment = async (sessionId, amount) => {
  const response = await fetch('/api/walkin/payment/initiate', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      sessionId,
      amount,
      successUrl: `${window.location.origin}/walkin/payment/success`,
      failureUrl: `${window.location.origin}/walkin/payment/failure`
    })
  });
  
  const data = await response.json();
  
  // Redirect to eSewa
  const form = document.createElement('form');
  form.method = 'POST';
  form.action = data.esewaUrl;
  
  Object.entries(data.esewaParams).forEach(([key, value]) => {
    const input = document.createElement('input');
    input.name = key;
    input.value = value;
    form.appendChild(input);
  });
  
  document.body.appendChild(form);
  form.submit();
};
```

### Step 4: Handle eSewa Callback
```javascript
import { useSearchParams } from 'react-router-dom';

const PaymentSuccessPage = () => {
  const [searchParams] = useSearchParams();
  
  useEffect(() => {
    const verify = async () => {
      const sessionId = searchParams.get('sessionId');
      const transactionUuid = searchParams.get('transactionUuid');
      
      const response = await fetch(
        `/api/walkin/payment/verify?sessionId=${sessionId}&transactionUuid=${transactionUuid}`
      );
      
      const data = await response.json();
      
      if (data.success) {
        setMessage(`✅ Payment of ${data.data.amountPaid} NPR verified!`);
        setRemaining(data.data.remainingBalance);
      } else {
        setMessage('❌ Payment verification failed');
      }
    };
    
    verify();
  }, [searchParams]);
  
  return <div>{message}</div>;
};
```

---

## 🔧 Environment Variables

Add these to your `.env` file:

```env
# Existing variables (unchanged)
PORT=4000
JWT_SECRET=your_jwt_secret
ESEWA_ENV=sandbox
ESEWA_PRODUCT_CODE=EPAYTEST
ESEWA_SECRET_KEY=8gBm/:&EnhH.1/q

# Frontend URL for callbacks (if different from localhost)
FRONTEND_URL=http://localhost:5173
```

---

## 📋 Implementation Checklist

- ✅ `walkInSessionModel.js` created
- ✅ `walkInPaymentController.js` created with:
  - ✅ `createWalkInSession()`
  - ✅ `getSessionDetails()`
  - ✅ `initiateWalkInPayment()` with unique transactionUuid
  - ✅ `verifyWalkInPayment()` with eSewa verification
  - ✅ `handleWalkInPaymentFailure()`
- ✅ `walkInRoute.js` created with all endpoints
- ✅ `server.js` updated with walk-in router import and registration
- ✅ `package.json` updated with `uuid` dependency
- ⏳ Run `npm install` to install uuid
- ⏳ Test all endpoints with Postman/Insomnia

---

## ⚠️ Critical Points to Remember

### 1. **Don't Mix Identifiers**
```javascript
// ❌ WRONG
const session = await orderModel.findById(sessionId); // sessionId ≠ orderId

// ✅ CORRECT
const session = await walkInSessionModel.findOne({ sessionId });
```

### 2. **Transaction UUIDs Must Be Unique**
```javascript
// ✅ Each payment gets a NEW uuid
const transactionUuid = uuidv4();
paymentRecord.transactionUuid = transactionUuid;

// ❌ NEVER reuse the same transaction uuid
```

### 3. **Keep Routes Separate**
```javascript
// Walk-in: /api/walkin/...
// Online:  /api/payment/order/...
// Never put walk-in logic in online payment routes
```

### 4. **Verify eSewa Response**
```javascript
// Always verify with eSewa API before marking payment as success
const verificationResponse = await fetch(
  `${config.statusEndpoint}${transactionUuid}?oid=${oid}`
);
```

---

## 🧪 Testing Flow

### Test Scenario: Complete Walk-In Payment

```bash
# 1. Create session
curl -X POST http://localhost:4000/api/walkin/session/create \
  -H "Content-Type: application/json" \
  -d '{
    "tableNumber": "5",
    "items": [],
    "totalBillAmount": 1000
  }'

# Response: {"sessionId": "WALKIN-..."}

# 2. Get session details
curl http://localhost:4000/api/walkin/session/WALKIN-...

# 3. Initiate payment
curl -X POST http://localhost:4000/api/walkin/payment/initiate \
  -H "Content-Type: application/json" \
  -d '{
    "sessionId": "WALKIN-...",
    "amount": 500
  }'

# 4. Use esewaParams to redirect to eSewa
# 5. eSewa redirects back with status
# 6. Verify using /api/walkin/payment/verify
```

---

## 📚 Additional Resources

- [MongoDB Transactions](https://docs.mongodb.com/manual/core/transactions/)
- [UUID v4 Spec](https://en.wikipedia.org/wiki/Universally_unique_identifier)
- [eSewa API Documentation](https://developer.esewa.com.np/)

---

## ❓ Troubleshooting

### "Session not found"
- Check sessionId format: `WALKIN-timestamp-random`
- Ensure MongoDB connection is active

### "Payment not found"
- Verify transactionUuid matches the one in session.payments array
- Check session.payments is not empty

### "Payment amount exceeds remaining balance"
- Calculate remaining: `totalBillAmount - totalPaidAmount`
- Check that amount <= remaining balance

### "Payment verification failed"
- Verify eSewa API endpoint is correct for your environment
- Check ESEWA_PRODUCT_CODE and ESEWA_SECRET_KEY in .env
- Ensure OID and refId are passed from eSewa callback

---

✅ **Merge Complete!** Your backend now supports both online orders and walk-in split payments with proper separation.
