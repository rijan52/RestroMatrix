# Walk-In Backend - Folder Structure Overview

## Complete Backend Structure (After Merge)

```
Backend/
│
├── 🆕 Models
│   ├── billModel.js                    (existing - online bills)
│   ├── cartModel.js                    (existing - online cart)
│   ├── customerModel.js                (existing - customer data)
│   ├── driverModel.js                  (existing - driver data)
│   ├── foodModel.js                    (existing - menu items)
│   ├── orderModel.js                   (existing - online orders)
│   ├── reservationModel.js             (existing - reservations)
│   └── ✨ walkInSessionModel.js        🆕 NEW - Walk-in dine-in sessions
│
├── 🆕 Controllers
│   ├── billController.js               (existing - bill management)
│   ├── cartController.js               (existing - shopping cart)
│   ├── customerController.js           (existing - customer operations)
│   ├── driverController.js             (existing - driver operations)
│   ├── esewaTestController.js          (existing - payment testing)
│   ├── foodController.js               (existing - menu management)
│   ├── orderController.js              (existing - order management)
│   ├── reservationController.js        (existing - reservations)
│   └── ✨ walkInPaymentController.js   🆕 NEW - Walk-in payment logic
│
├── 🆕 Routes
│   ├── billRoute.js                    (existing - bill endpoints)
│   ├── cartRoute.js                    (existing - cart endpoints)
│   ├── customerRoute.js                (existing - customer endpoints)
│   ├── driverRoute.js                  (existing - driver endpoints)
│   ├── esewaTestRoute.js               (existing - payment test endpoints)
│   ├── foodRoute.js                    (existing - menu endpoints)
│   ├── orderRoute.js                   (existing - order endpoints)
│   ├── reservationRoute.js             (existing - reservation endpoints)
│   └── ✨ walkInRoute.js               🆕 NEW - Walk-in payment routes
│
├── 📁 Config
│   └── db.js                           (database connection)
│
├── 📁 Middleware
│   └── auth.js                         (authentication)
│
├── 📁 Services
│   └── ...                             (utility services)
│
├── 📁 Socket
│   └── deliveryTracking.js             (real-time tracking)
│
├── 📁 Utils
│   └── ...                             (helper functions)
│
├── 📁 Uploads
│   └── ...                             (user uploaded files)
│
├── ✏️ server.js                        UPDATED - Imported walkInRouter
├── package.json                        UPDATED - Added uuid dependency
│
├── 📖 Documentation Files (NEW)
│   ├── ✨ WALKIN_INTEGRATION_GUIDE.md
│   ├── ✨ ONLINE_VS_WALKIN_ARCHITECTURE.md
│   ├── ✨ WALKIN_API_TESTING_GUIDE.md
│   ├── ✨ WALKIN_MERGE_IMPLEMENTATION_SUMMARY.md
│   └── ✨ .env.example
│
├── .env                                (environment variables - UPDATE NEEDED)
├── .env.example                        (reference - NEW)
├── eslint.config.js
├── package-lock.json
└── README.md
```

---

## 🔄 Request Flow - How Requests Route Through System

```
┌─────────────────────────────────────────────────────────────────────────┐
│                        INCOMING HTTP REQUESTS                           │
└─────────────────────────────────────────────────────────────────────────┘

                                   ↓
                          app.use(middleware)
                          (express.json, cors)
                                   ↓
                    ┌───────────────┴───────────────┐
                    ↓                               ↓
          [ /api/payment/... ]              [ /api/walkin/... ]
          (ONLINE PAYMENTS)                  (WALK-IN PAYMENTS)
                    ↓                               ↓
              billRouter                     walkInRouter 🆕
           or orderRouter                         ↓
                    ↓                    walkInPaymentController.js 🆕
         billController.js                        ↓
         or orderController.js          walkInSessionModel 🆕
                    ↓                             ↓
         orderModel / billModel           Payment Record
              (MongoDB)                     (MongoDB)
                    ↓                             ↓
            eSewa Payment API            eSewa Payment API
```

---

## 📊 Data Flow Separation

```
┌──────────────────────────────────────────────────────────────────────────┐
│                           MONGODB DATABASE                               │
├──────────────────────────────────────────────────────────────────────────┤
│                                                                          │
│  ONLINE CUSTOMERS (UNCHANGED)      │    WALK-IN CUSTOMERS (NEW)         │
│  ─────────────────────────────     │    ──────────────────────────       │
│  Collections:                      │    Collections:                   │
│  ├─ orders                         │    └─ walkinSessions 🆕          │
│  │  └─ _id: orderId               │       └─ sessionId: String       │
│  │                                │                                   │
│  ├─ carts                         │       Schema:                   │
│  │  └─ userId based               │       {                         │
│  │                                │         sessionId,              │
│  ├─ bills                         │         tableNumber,            │
│  │  └─ billId based               │         totalBillAmount,        │
│  │                                │         payments: [             │
│  └─ customers                     │           {                     │
│     └─ customerId based           │             transactionUuid,    │
│                                   │             amountPaid,         │
│  Routes: /api/order/*             │             status              │
│          /api/bills/*             │           }                     │
│          /api/cart/*              │         ],                      │
│          /api/customer/*          │         totalPaidAmount,        │
│                                   │         status                  │
│  Controller: orderController.js   │       }                         │
│             billController.js     │                                   │
│                                   │    Routes: /api/walkin/*        │
│                                   │                                   │
│                                   │    Controller:                  │
│                                   │    walkInPaymentController.js 🆕 │
│                                   │                                   │
└──────────────────────────────────────────────────────────────────────────┘
```

---

## 🎯 API Endpoint Organization

### Online Payment Endpoints (UNCHANGED)
```
/api/
├─ /orders/
│  ├─ POST /create
│  ├─ GET /:orderId
│  └─ PATCH /:orderId/status
│
├─ /bills/
│  ├─ POST /create
│  ├─ GET /:billId
│  └─ PATCH /:billId/payment
│
├─ /payment/
│  ├─ /order/
│  │  └─ POST /esewa/initiate
│  ├─ POST /success
│  └─ POST /failure
│
└─ /cart/
   ├─ POST /add
   ├─ GET /
   └─ PATCH /:itemId/quantity
```

### Walk-In Payment Endpoints (NEW)
```
/api/walkin/ (🆕 NEW ROUTES)
│
├─ /session/
│  ├─ POST /create                    → createWalkInSession()
│  └─ GET /:sessionId                 → getSessionDetails()
│
└─ /payment/
   ├─ POST /initiate                  → initiateWalkInPayment()
   ├─ GET /verify                     → verifyWalkInPayment()
   └─ GET /failure                    → handleWalkInPaymentFailure()
```

---

## 🔑 Key Identifiers Usage

```
┌────────────────────────────────────────────────────────────────────┐
│                    IDENTIFIER NAMING CONVENTION                    │
├────────────────────────────────────────────────────────────────────┤
│                                                                    │
│  ONLINE PAYMENTS:                    WALK-IN PAYMENTS:            │
│  ────────────────                    ────────────────              │
│  orderId        → MongoDB ObjectId   sessionId    → WALKIN-uuid   │
│  transactionUuid→ One per order      transactionUuid
│                                      → UNIQUE per payment   │
│  Ex: 507f1f77bcf86cd799439011       Ex: uuid-xxx-yyy      │
│                                      (generates per attempt)   │
│  billId         → MongoDB ObjectId   paymentId   → UUID          │
│  cartId         → MongoDB ObjectId   tableNumber → String        │
│                                                                    │
│  ⚠️  NEVER MIX IDENTIFIERS BETWEEN FLOWS                          │
│      orderId ≠ sessionId                                          │
│      Different models, different purposes!                       │
│                                                                    │
└────────────────────────────────────────────────────────────────────┘
```

---

## 🔌 Module Dependencies

```
server.js (Entry Point)
    ↓
    ├─→ walkInRouter 🆕
    │       ↓
    │   walkInPaymentController 🆕
    │       ↓
    │   walkInSessionModel 🆕
    │
    ├─→ orderRouter
    │       ↓
    │   orderController
    │       ↓
    │   orderModel
    │
    ├─→ billRouter
    │       ↓
    │   billController
    │       ↓
    │   billModel
    │
    └─→ cartRouter
            ↓
         cartController
            ↓
         cartModel
```

---

## 📈 Scaling Notes

### Current Structure Supports:
- ✅ Multiple concurrent sessions
- ✅ Split payments per session
- ✅ Payment history tracking
- ✅ Separate online/walk-in flows
- ✅ Easy to add more payment methods

### If You Need to Expand:
```javascript
// Add new walk-in features:
Backend/
├── models/
│   ├── walkInSessionModel.js    (keep)
│   └── walkinNotificationModel.js (add if needed)
│
├── controllers/
│   ├── walkInPaymentController.js (keep)
│   └── walkInNotificationController.js (add if needed)
│
└── routes/
    ├── walkInRoute.js           (keep)
    └── walkInNotificationRoute.js (add if needed)
```

---

## ✅ Pre-Deployment Checklist

Using this folder structure:

- [ ] All files exist in correct locations
- [ ] server.js imports walkInRouter
- [ ] package.json has uuid dependency
- [ ] .env file configured
- [ ] MongoDB connection working
- [ ] Both online AND walk-in routes responding
- [ ] No console errors on startup
- [ ] Test data in MongoDB
- [ ] eSewa credentials working

---

## 🗂️ File Size Reference

After merge, expect:
```
Backend/
├── models/          ~15 KB (added 2 KB: walkInSessionModel)
├── controllers/     ~30 KB (added 8 KB: walkInPaymentController)
├── routes/          ~10 KB (added 1 KB: walkInRoute)
├── config/          ~2 KB
├── middleware/      ~5 KB
├── socket/          ~4 KB
├── utils/           ~8 KB
├── uploads/         ~ variable
├── node_modules/    ~500+ MB
└── docs/            ~50 KB (added guides)
```

---

## 🔍 Quick File Finder

| Purpose | File | Status |
|---------|------|--------|
| Walk-in session creation | models/walkInSessionModel.js | ✨ NEW |
| Walk-in payment logic | controllers/walkInPaymentController.js | ✨ NEW |
| Walk-in routes | routes/walkInRoute.js | ✨ NEW |
| Server config | server.js | ✏️ UPDATED |
| Dependencies | package.json | ✏️ UPDATED |
| Integration guide | WALKIN_INTEGRATION_GUIDE.md | ✨ NEW |
| Architecture docs | ONLINE_VS_WALKIN_ARCHITECTURE.md | ✨ NEW |
| Testing guide | WALKIN_API_TESTING_GUIDE.md | ✨ NEW |
| Implementation summary | WALKIN_MERGE_IMPLEMENTATION_SUMMARY.md | ✨ NEW |

---

✅ **Structure is clean, modular, and production-ready!**
