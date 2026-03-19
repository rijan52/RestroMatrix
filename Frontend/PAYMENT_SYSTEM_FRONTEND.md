# Frontend Implementation - QR-Based Split Payment System

## Overview
Complete React frontend for QR-based split bill payment system with admin bill generation and customer payment interface.

---

## FILE STRUCTURE

### Admin Frontend
```
Development/admin/src/
├── services/
│   └── billService.js           # API calls for bill operations
├── pages/
│   └── BillQR/
│       ├── BillQR.jsx           # Bill QR generator page
│       └── BillQR.css           # Styles
└── components/sidebar/
    └── sidebar.jsx              # Added Bill QR Generator link
```

### Customer Frontend
```
Development/Frontend/src/
├── services/
│   └── billService.js           # API calls for payment operations
├── pages/
│   ├── Payment/
│   │   ├── Payment.jsx          # Payment form page
│   │   └── Payment.css          # Styles
│   ├── PaymentSuccess/
│   │   ├── PaymentSuccess.jsx   # Success page
│   │   └── PaymentResult.css    # Styles
│   └── PaymentFailure/
│       ├── PaymentFailure.jsx   # Failure page
│       └── PaymentResult.css    # Styles
└── App.jsx                       # Added new routes
```

---

## ADMIN PANEL: BILL QR GENERATOR

### Route: `/bill-qr`

### Features:
✅ Generate QR code for restaurant bills  
✅ Input: Table Number, Total Amount  
✅ Display: Bill ID, QR Code, Payment Link  
✅ Copy payment link to clipboard  
✅ Print QR code  

### Component: `BillQR.jsx`

```jsx
<BillQR url="http://localhost:4000" />
```

### Form Inputs:
```
Table Number: [input] (e.g., 5)
Total Amount: [input] (e.g., 1000)
[Generate QR Button]
```

### Output Display:
```
Bill ID: 507f1f77bcf86cd799439011
Table Number: 5
Total Amount: NPR 1000

[QR Code Image]

Payment Link: http://localhost:5173/pay/507f1f77bcf86cd799439011
[Copy Link Button]

[Print QR Button] [Generate New Bill Button]
```

### API Call:
```javascript
POST /api/bills/create
{
  "tableNumber": 5,
  "totalAmount": 1000
}
```

---

## CUSTOMER PAYMENT PAGE

### Route: `/pay/:billId`

### Features:
✅ Display bill amount breakdown  
✅ Payment progress indicator  
✅ Enter payment amount  
✅ Quick payment buttons (Full Amount, Half Amount)  
✅ Multi-currency support (NPR)  
✅ Auto-refresh bill status every 5 seconds  
✅ Prevent overpayment  
✅ Disable payment for fully paid bills  

### Component: `Payment.jsx`

### Display Information:
```
Bill Payment

Total Bill Amount:    NPR 1000
Paid Amount:          NPR 300   (green)
Remaining Amount:     NPR 700   (orange - highlighted)

Progress Bar: ████░░░░ 30% Paid

Enter Payment Amount:  [NPR] [input field]
                       [Pay Full (700)] [Pay Half (350)]

[🏦 Pay with eSewa Button]

💡 Tip: Multiple customers can split this bill.
   The payment link can be shared with others.
```

### Business Logic:
```
1. Fetch bill details from API
2. Display payment progress
3. Validate payment amount:
   - Must be > 0
   - Cannot exceed remaining amount
4. If bill is PAID:
   - Show "Bill Already Paid" message
   - Disable payment input
5. On payment submit:
   - Call initiateEsewaPayment API
   - Redirect to eSewa sandbox form
   - eSewa redirects to success/failure URL
```

### API Calls:
```javascript
// Fetch bill details
GET /api/bills/:billId

// Initiate payment
POST /api/payment/esewa/initiate
{
  "billId": "507f1f77bcf86cd799439011",
  "amount": 200
}

// Response redirects to eSewa or payment/success
```

---

## PAYMENT SUCCESS PAGE

### Route: `/payment/success`

Query Parameters:
- `transaction_uuid`: Transaction ID
- `status`: Complete/Failed
- `transaction_code`: eSewa transaction code

### Display:
```
✓ (green checkmark icon)

Payment Successful!

Your payment has been processed successfully.

Transaction ID:    507f1f77bcf86cd799439011_1710508800000_a1b2c3d4
Total Amount:      NPR 1000
Paid Amount:       NPR 500  (green)
Remaining Amount:  NPR 500

[If Fully Paid]
🎉 Bill Has Been Fully Paid!
Thank you for your payment. This bill is now complete.

[If Partially Paid]
ℹ️ This bill can still accept payments from other customers.
   Share the payment link: /pay/507f1f77bcf86cd799439011

[Go to Home Button] [Make Another Payment Button]
```

### Features:
✅ Display transaction details  
✅ Show updated bill amount  
✅ Congratulations message if fully paid  
✅ Share link option if partial payment  
✅ Navigation buttons  

---

## PAYMENT FAILURE PAGE

### Route: `/payment/failure`

Query Parameters:
- `transaction_uuid`: Transaction ID (optional)

### Display:
```
✕ (red X icon)

Payment Failed

Unable to process your payment. Please try again.

Transaction ID: 507f1f77bcf86cd799439011_1710508800000_a1b2c3d4

⚠️ Your payment could not be processed. This may be due to:

- Insufficient balance in your eSewa account
- Network connectivity issues
- Invalid payment details
- Transaction timeout

[Try Again Button] [Go to Home Button]
```

### Features:
✅ Error details display  
✅ Helpful troubleshooting tips  
✅ Navigation options  
✅ Retry payment button  

---

## API SERVICE LAYER

### Admin Service: `services/billService.js`

```javascript
// Create a new bill
createBill(tableNumber, totalAmount)

// Get bill details
getBill(billId)

// Get all bills
getAllBills(params)

// Get bill by QR code
getBillByQR(qrCodeData)

// Get all payments for a bill
getBillPayments(billId)

// Close a bill
closeBill(billId)
```

### Customer Service: `services/billService.js`

```javascript
// Get bill details
getBill(billId)

// Initiate eSewa payment
initiateEsewaPayment(billId, amount)

// Get bill by QR code
getBillByQR(qrCodeData)

// Get payments for display
getBillPayments(billId)
```

---

## INSTALLATION & SETUP

### 1. Install Dependencies
```bash
# Admin Frontend
cd Development/admin
npm install qrcode.react
npm install

# Customer Frontend
cd Development/Frontend
npm install qrcode.react
npm install
```

### 2. Update Routes

**Admin App.jsx:**
```jsx
import BillQR from './pages/BillQR/BillQR'

<Route path="/bill-qr" element={<BillQR url={url} />} />
```

**Frontend App.jsx:**
```jsx
import Payment from './pages/Payment/Payment'
import PaymentSuccess from './pages/PaymentSuccess/PaymentSuccess'
import PaymentFailure from './pages/PaymentFailure/PaymentFailure'

<Route path="/pay/:billId" element={<Payment />} />
<Route path="/payment/success" element={<PaymentSuccess />} />
<Route path="/payment/failure" element={<PaymentFailure />} />
```

**Sidebar:**
```jsx
<NavLink to='/bill-qr' className="sidebar-option">
    <p>Bill QR Generator</p>
</NavLink>
```

### 3. Start Frontend
```bash
# Admin
npm run dev  # http://localhost:5173

# Frontend
npm run dev  # http://localhost:5173
```

---

## USER FLOW

### Admin: Generate Bill QR

1. Navigate to Admin → Bill QR Generator
2. Enter Table Number (e.g., 5)
3. Enter Total Amount (e.g., 1000)
4. Click "Generate QR"
5. QR code displays
6. Options:
   - Copy payment link
   - Print QR code
   - Generate new bill

### Customer: Pay Bill

1. Scan QR code or visit link: `/pay/{billId}`
2. See bill summary with payment progress
3. Enter payment amount
4. Use quick buttons (Pay Full, Pay Half)
5. Click "Pay with eSewa"
6. Redirected to eSewa sandbox payment page
7. Complete eSewa payment
8. Redirected to success/failure page

### Multiple Customers Splitting Bill

**Example: NPR 1000 bill**

Customer A:
1. Scans QR → `/pay/{billId}`
2. Pays NPR 200 → Success
3. Remaining: 800

Customer B:
1. Scans QR → `/pay/{billId}`
2. Sees Remaining: 800
3. Pays NPR 300 → Success
4. Remaining: 500

Customer C:
1. Scans QR → `/pay/{billId}`
2. Sees Remaining: 500
3. Pays NPR 500 → Success
4. Bill PAID ✓
5. QR deactivated

---

## STYLING & RESPONSIVE DESIGN

### Color Scheme:
- Primary: Purple gradient (#667eea → #764ba2)
- Success: Green (#4caf50)
- Warning: Orange (#ff9800)
- Error: Red (#f44336)
- Text: Dark Gray (#333)
- Background: Light Gray (#f5f5f5)

### Responsive Breakpoints:
- Desktop: 1024px+
- Tablet: 768px - 1023px
- Mobile: < 768px

### Key Features:
✅ Fully responsive layouts  
✅ Touch-friendly buttons  
✅ Mobile-optimized forms  
✅ Smooth animations  
✅ Loading states  
✅ Error handling  

---

## COMPONENTS STRUCTURE

```
BillQR
├── Form (table number, amount)
├── Bill Display
│   ├── Bill Info (ID, table, amount)
│   ├── QR Code Display
│   ├── Payment Link Section
│   └── Action Buttons (Copy, Print, Generate New)
└── Toast Notifications

Payment
├── Bill Summary (totals, paid, remaining)
├── Progress Bar
├── Payment Form
│   ├── Amount Input (NPR)
│   ├── Quick Buttons (Full, Half)
│   └── Pay Button
├── Auto-refresh Status
└── Paid Bill Message (if complete)

PaymentSuccess
├── Success Icon
├── Transaction Details
├── Bill Information
├── Congratulations Message (if fully paid)
├── Navigation Buttons
└── Share Link (if partial)

PaymentFailure
├── Failure Icon
├── Error Message
├── Troubleshooting Tips
├── Transaction ID
└── Navigation Buttons
```

---

## ERROR HANDLING

### Admin Panel:
- ✓ Validation for table number (> 0)
- ✓ Validation for amount (> 0)
- ✓ Error toast notifications
- ✓ Loading states
- ✓ Copy feedback

### Customer Payment:
- ✓ Bill not found error
- ✓ Overpayment prevention
- ✓ Invalid amount validation
- ✓ Bill already paid prevention
- ✓ API error handling
- ✓ Network error handling

### Success/Failure Pages:
- ✓ Transaction verification
- ✓ Bill status display
- ✓ Helpful error messages
- ✓ Retry options

---

## FEATURES IMPLEMENTED

✅ Admin QR code generation  
✅ Customer payment processing  
✅ Multiple payment splitting  
✅ Auto-deactivation of QR when paid  
✅ Progress tracking  
✅ eSewa sandbox integration  
✅ Success/Failure feedback  
✅ Copy-to-clipboard functionality  
✅ Print functionality  
✅ Auto-refresh bill status  
✅ Responsive design  
✅ Error handling  
✅ Loading states  
✅ Toast notifications  

---

## TESTING WORKFLOW

### Admin Test:
1. Open browser → http://localhost:5173/bill-qr
2. Enter Table: 5, Amount: 1000
3. Click Generate QR
4. Copy link or print QR
5. Verify QR code displays correct bill ID

### Customer Test:
1. Visit: http://localhost:5173/pay/{billId} (from step 3 above)
2. See: Remaining Amount: 1000
3. Enter: 200
4. Submit → eSewa sandbox
5. Complete test payment
6. Redirected to success page
7. Verify: Paid Amount: 200, Remaining: 800

### Split Payment Test:
1. Generate bill for 1000
2. Customer A: pays 300 (remaining: 700)
3. Customer B: pays 400 (remaining: 300)
4. Customer C: pays 300 (remaining: 0)
5. Bill status: PAID, QR inactive

---

## NEXT STEPS

1. **QR Scanner:** Add QR code scanning library
2. **Mobile App:** Create React Native version
3. **Analytics:** Dashboard showing payment trends
4. **Notifications:** Real-time updates via WebSocket
5. **Receipts:** Generate PDF receipts
6. **Refunds:** Handle partial refunds
7. **Multiple Currency:** Support for other currencies
8. **Offline Mode:** Cache bill data offline

