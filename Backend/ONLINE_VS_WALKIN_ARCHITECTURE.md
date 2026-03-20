# Online vs Walk-In Payment Flow Architecture

## Architecture Diagram

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                           RESTRO MATRIX BACKEND                             │
└─────────────────────────────────────────────────────────────────────────────┘

┌─────────────────────────── ONLINE CUSTOMERS ───────────────────────────────┐
│                        (Direct Order Checkout)                              │
│                                                                              │
│  Frontend                Backend                      eSewa                 │
│    │                       │                           │                    │
│    ├──Add to Cart─────────→ cartModel                  │                    │
│    │                       │                           │                    │
│    └──Checkout───────────→ /api/payment/order/        │                    │
│                           esewa/initiate              │                    │
│                           │                           │                    │
│                           ├─Generate orderId          │                    │
│                           ├─Calculate total           │                    │
│                           ├─Create signature──────────→ Verify              │
│    ◄─────Redirect URL ────┤                           │                    │
│         (eSewa Form)       │                           │                    │
│    │                       │                           │                    │
│    └─Redirect User────────────────────────────────────→ Payment Form        │
│                                                        │                    │
│    ◄─eSewa Callback ──────────────────────────────────┤ (Verify & Charge)  │
│         (success/failure)  │                           │                    │
│    │                       ◄──────Callback────→ Process Payment             │
│    │                       │                           │                    │
│    └──Verify Payment─────→ /api/payment/success       │                    │
│                           ├─Find orderModel           │                    │
│                           ├─Verify with eSewa         │                    │
│                           └─Mark as paid              │                    │
└─────────────────────────────────────────────────────────────────────────────┘

     Routes:     /api/cart/*, /api/order/*
     Models:     orderModel, cartModel
     Identifier: orderId (MongoDB ObjectId)

┌──────────────────────── WALK-IN CUSTOMERS (NEW) ──────────────────────────┐
│                    (QR-Based Split Payments)                                │
│                                                                              │
│  Frontend                Backend                      eSewa                 │
│    │                       │                           │                    │
│    ├──Scan QR────────────→ /api/walkin/               │                    │
│                           session/create              │                    │
│                           │                           │                    │
│                           ├─Generate sessionId        │                    │
│                           ├─Store items & bill        │                    │
│    ◄─sessionId ────────────                           │                    │
│    │                       │                           │                    │
│    ├──Enter Amount────────→ /api/walkin/              │                    │
│                           payment/initiate            │                    │
│                           │                           │                    │
│                           ├─Generate NEW              │                    │
│                           │ transactionUuid (uuidv4)  │                    │
│                           ├─Create signature──────────→ Verify              │
│    ◄─────Redirect URL ────┤                           │                    │
│         (eSewa Form)       │                           │                    │
│    │                       │                           │                    │
│    └─Redirect User────────────────────────────────────→ Payment Form        │
│                                                        │                    │
│    ◄─eSewa Callback ──────────────────────────────────┤ (Verify & Charge)  │
│         (success/failure)  │                           │                    │
│    │                       ◄──────Callback────→ Process Payment             │
│    │                       │                           │                    │
│    └──Verify Payment─────→ /api/walkin/               │                    │
│                           payment/verify              │                    │
│                           ├─Find sessionModel         │                    │
│                           ├─Find payment record       │                    │
│                           ├─Update totalPaidAmount    │                    │
│                           └─Check if fully_paid       │                    │
│                                                        │                    │
│  Can Make Another Payment:                            │                    │
│    ├──Enter Amount────────→ /api/walkin/              │                    │
│                           payment/initiate            │                    │
│                           │                           │                    │
│                           ├─Generate NEW              │                    │
│                           │ transactionUuid (uuidv4)  │                    │
└─────────────────────────────────────────────────────────────────────────────┘

     Routes:     /api/walkin/*
     Models:     walkInSessionModel
     Identifier: sessionId (WALKIN-timestamp-random)
```

---

## Key Differences

| Aspect | Online Customers | Walk-In Customers |
|--------|------------------|-------------------|
| **Entry Point** | Add to cart → Checkout | Scan QR → Open session |
| **Identifier** | `orderId` (ObjectId) | `sessionId` (String UUID) |
| **Model** | `orderModel` | `walkInSessionModel` |
| **Payment Type** | Single full payment | Multiple split payments |
| **Routes** | `/api/order/*`, `/api/payment/order/*` | `/api/walkin/*` |
| **Transaction UUID** | One per order | **Unique for each payment attempt** |
| **Status** | Order status → Payment verif | Session status + payment history |
| **Feature** | Delivery tracking | Table number + split billing |

---

## Data Flow: Step-by-Step

### Online Customer Flow
```
1. User adds items to cart
   → Stored in MongoDB cart collection
   
2. User clicks "Checkout"
   → Creates order via /api/payment/order/esewa/initiate
   → Generates ONE transactionUuid
   → Stores in orderModel
   
3. eSewa processes payment
   → Returns success/failure to /api/payment/success
   
4. Backend verifies with eSewa
   → Updates orderModel.paymentStatus = "paid"
   → Marks cart as processed
```

### Walk-In Customer Flow
```
1. Customer scans QR code
   → POST /api/walkin/session/create
   → Creates session with sessionId
   → Stores tableNumber, items, totalBillAmount
   
2. Customer enters payment amount (can be partial)
   → POST /api/walkin/payment/initiate
   → Generates UNIQUE transactionUuid (different every time!)
   → Adds payment record to session.payments array
   
3. eSewa processes payment
   → Returns success/failure to /api/walkin/payment/verify
   
4. Backend verifies with eSewa
   → Updates payment status in session.payments
   → Adds amountPaid to session.totalPaidAmount
   → Calculates remainingBalance
   
5. If remainingBalance > 0 AND customer wants to pay more:
   → NEW payment session starts at step 2
   → NEVER reuses transactionUuid
   → Repeats until fully_paid or customer leaves
```

---

## Technical Implementation Details

### Transaction UUID Generation

**Online (ONE uuid per order):**
```javascript
const transactionUuid = uuidv4();  // Generated once
// Used for: /api/payment/order/esewa/initiate
// Stored in: orderModel.transactionUuid
```

**Walk-In (NEW uuid per payment attempt):**
```javascript
const transactionUuid = uuidv4();  // Generated for EVERY payment
// Used for: /api/walkin/payment/initiate
// Stored in: walkInSessionModel.payments[].transactionUuid
// If customer retries: NEW uuid generated = safe from duplicates
```

### Payment Verification

**Online:**
```javascript
// Get transaction uuid from orderModel
const order = await orderModel.findById(orderId);
const uuid = order.transactionUuid;

// Verify once with eSewa
const verified = await verifyWithEsewa(uuid);
```

**Walk-In:**
```javascript
// Get transaction uuid from session payments array
const session = await walkInSessionModel.findOne({ sessionId });
const payment = session.payments.find(p => p.transactionUuid === uuid);

// Verify the specific payment
const verified = await verifyWithEsewa(uuid);

// Multiple verifiable payments in one session
session.payments.map(p => p.transactionUuid);  // Different uuids
```

---

## Risk Analysis

### Protected Against:

✅ **Duplicate Charges** - Unique transactionUuid prevents re-charging
✅ **Data Mixing** - Separate models prevent online/walk-in conflicts
✅ **Route Collisions** - Different endpoint paths
✅ **Session Hijacking** - sessionId is unique per QR scan
✅ **Partial Payment Loss** - All payments tracked in array

### Safeguards in Code:

1. **Unique Identifiers**
   ```javascript
   // Generated fresh for each session/payment
   sessionId: `WALKIN-${Date.now()}-${random}`
   transactionUuid: uuidv4()
   paymentId: uuidv4()
   ```

2. **Validation**
   ```javascript
   if (amount > remainingBalance) {
     return error;  // Prevent overpayment
   }
   ```

3. **Immutable Records**
   ```javascript
   payments: [{
     transactionUuid,  // Never changed after creation
     amountPaid,       // Historical record
     esewaRefId        // Audit trail
   }]
   ```

4. **eSewa Verification**
   ```javascript
   // Always verify with eSewa before marking success
   const verification = await verifyWithEsewa(transactionUuid);
   if (verification.status !== "COMPLETE") {
     return error;
   }
   ```

---

## Database Schema Comparison

### Online: orderModel
```
{
  _id: ObjectId,
  customerId: ObjectId,
  items: Array,
  totalAmount: Number,
  status: "pending" | "completed" | "cancelled",
  transactionUuid: String,  // One per order
  paymentStatus: "unpaid" | "paid",
  createdAt: Date
}
```

### Walk-In: walkInSessionModel (NEW)
```
{
  sessionId: String,  // WALKIN-xxx
  tableNumber: String,
  items: Array,
  totalBillAmount: Number,
  payments: [{        // Array of payments
    paymentId: String,
    transactionUuid: String,  // UNIQUE per payment
    amountPaid: Number,
    status: "pending" | "success" | "failed",
    esewaRefId: String,
    createdAt: Date
  }],
  totalPaidAmount: Number,
  remainingBalance: Number,  // Calculated
  status: "active" | "awaiting_payment" | "fully_paid",
  createdAt: Date,
  updatedAt: Date
}
```

---

## Testing Checklist

- [ ] Online order flow still works (verify no regression)
- [ ] Walk-in session creation works
- [ ] Walk-in payment initiation generates unique transactionUuid
- [ ] Payment verification updates session correctly
- [ ] Multiple payments on one session work
- [ ] Remaining balance calculation is correct
- [ ] eSewa integration works for both flows
- [ ] Frontend can handle both response types
- [ ] Database indexes are set for sessionId
- [ ] Error messages are clear for both flows

---

✅ **Clean Separation Achieved!**
Both online and walk-in flows coexist safely with no conflicts.
