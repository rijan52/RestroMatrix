# eSewa Test API Documentation

## Overview

The eSewa Test API provides endpoints to test eSewa payment integration without making actual payments. This is useful for development, debugging, and testing the payment flow.

## Quick Start

### 1. Get Test Credentials
```bash
# PowerShell
.\esewa-test-api.ps1 credentials

# cURL
curl http://localhost:4000/api/esewa-test/credentials
```

Response:
```json
{
  "success": true,
  "credentials": {
    "productCode": "TESTMERCHANT",
    "endpoint": "https://rc-epay.esewa.com.np/api/epay/main/v2/form",
    "environment": "sandbox",
    "testAmount": "100.00",
    "minimumAmount": "1"
  }
}
```

### 2. Generate Test Payment Payload
```bash
# PowerShell
.\esewa-test-api.ps1 payload -Amount 150

# cURL
curl -X POST http://localhost:4000/api/esewa-test/generate-payload \
  -H "Content-Type: application/json" \
  -d '{"amount": "150"}'
```

Response includes:
- Payment endpoint URL
- Signed parameters ready for eSewa
- Transaction UUID for tracking

### 3. Verify Payment
```bash
# PowerShell
.\esewa-test-api.ps1 verify -UUID TEST-1234567890-ABC123

# cURL
curl -X POST http://localhost:4000/api/esewa-test/verify \
  -H "Content-Type: application/json" \
  -d '{"transaction_uuid": "TEST-1234567890-ABC123", "total_amount": "150.00"}'
```

---

## API Endpoints

### GET /api/esewa-test/credentials
Get eSewa test configuration and instructions.

**Response:**
```json
{
  "success": true,
  "credentials": {
    "productCode": "string",
    "endpoint": "string",
    "environment": "sandbox|live",
    "testAmount": "string",
    "minimumAmount": "string"
  },
  "instructions": {
    "step1": "string",
    "step2": "string",
    "step3": "string",
    "step4": "string",
    "step5": "string"
  }
}
```

---

### POST /api/esewa-test/generate-payload
Generate a test payment payload.

**Request Body:**
```json
{
  "amount": "100",           // Required, minimum 1
  "tax_amount": "0",         // Optional
  "service_charge": "0",     // Optional
  "delivery_charge": "50"    // Optional
}
```

**Response:**
```json
{
  "success": true,
  "message": "Test payment payload generated",
  "payment": {
    "endpoint": "https://rc-epay.esewa.com.np/api/epay/main/v2/form",
    "params": {
      "amount": "100.00",
      "tax_amount": "0.00",
      "total_amount": "150.00",
      "transaction_uuid": "TEST-1710528345123-ABC123",
      "product_code": "TESTMERCHANT",
      "product_name": "RestroMatrix Test Payment",
      "product_service_charge": "0.00",
      "product_delivery_charge": "50.00",
      "success_url": "http://localhost:4000/api/esewa-test/success?transaction_uuid=...",
      "failure_url": "http://localhost:4000/api/esewa-test/failure?transaction_uuid=...",
      "signed_field_names": "total_amount,transaction_uuid,product_code",
      "signature": "HMAC-SHA256-BASE64-ENCODED-STRING"
    }
  }
}
```

---

### GET /api/esewa-test/success
Mock success callback (redirected after successful payment in eSewa sandbox).

**Query Parameters:**
- `transaction_uuid` - The test transaction UUID

**Response:**
```json
{
  "success": true,
  "message": "Test payment successful",
  "transaction_uuid": "TEST-1710528345123-ABC123",
  "status": "COMPLETE"
}
```

---

### GET /api/esewa-test/failure
Mock failure callback (redirected after failed payment in eSewa sandbox).

**Query Parameters:**
- `transaction_uuid` - The test transaction UUID

**Response:**
```json
{
  "success": false,
  "message": "Test payment failed",
  "transaction_uuid": "TEST-1710528345123-ABC123",
  "status": "FAILED"
}
```

---

### POST /api/esewa-test/verify
Verify a test payment status (simulates eSewa status endpoint).

**Request Body:**
```json
{
  "transaction_uuid": "TEST-1710528345123-ABC123",
  "total_amount": "150.00"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Test payment verified",
  "data": {
    "transaction_uuid": "TEST-1710528345123-ABC123",
    "status": "COMPLETE",
    "total_amount": "150.00",
    "ref_id": "TEST-1710528345123"
  }
}
```

---

## Usage Examples

### Example 1: Test with Basic Amount
```bash
.\esewa-test-api.ps1 payload -Amount 100
```

### Example 2: Test with All Charges
```bash
.\esewa-test-api.ps1 payload -Amount 200 -Tax 18 -Service 10 -Delivery 50
```

### Example 3: Verify Payment After Success
```bash
# Get UUID from payload response, e.g., TEST-1710528345123-ABC123
.\esewa-test-api.ps1 verify -UUID TEST-1710528345123-ABC123 -Amount 150
```

### Example 4: Using cURL for Custom Testing
```bash
# Get credentials
curl http://localhost:4000/api/esewa-test/credentials

# Generate payload
curl -X POST http://localhost:4000/api/esewa-test/generate-payload \
  -H "Content-Type: application/json" \
  -d '{
    "amount": "250",
    "tax_amount": "25",
    "service_charge": "15",
    "delivery_charge": "50"
  }'

# Verify payment
curl -X POST http://localhost:4000/api/esewa-test/verify \
  -H "Content-Type: application/json" \
  -d '{
    "transaction_uuid": "TEST-ABC123",
    "total_amount": "340.00"
  }'
```

---

## Testing Workflow

### Frontend Integration Testing

1. **Generate Test Payload:**
   ```
   POST /api/esewa-test/generate-payload
   ```
   Captures the response parameters

2. **Create Form:**
   ```html
   <form action="https://rc-epay.esewa.com.np/api/epay/main/v2/form" method="POST">
     <!-- Add all params from response -->
   </form>
   ```

3. **Submit to eSewa:**
   In sandbox mode, eSewa will accept test payments

4. **Get Redirected:**
   Success/Failure URLs points back to your app

5. **Verify in Frontend:**
   Verify payment status with transaction UUID

### Backend Verification

After receiving success callback:
```bash
.\esewa-test-api.ps1 verify -UUID <transaction_uuid> -Amount <total_amount>
```

---

## Environment Variables

Configure these in `.env` file in the Backend folder:

```env
# eSewa Sandbox Configuration (for testing)
ESEWA_ENV=sandbox
ESEWA_PRODUCT_CODE=EPAYTEST
ESEWA_SECRET_KEY=8gBm/:&EnhH.1/q

# Backend URL (for callbacks)
BACKEND_URL=http://localhost:4000
```

### For Production:

```env
ESEWA_ENV=live
ESEWA_PRODUCT_CODE=your_live_product_code
ESEWA_SECRET_KEY=your_live_secret_key
BACKEND_URL=your_production_backend_url
```

---

## Troubleshooting

### "Invalid payload signature" Error (ES104)

**Cause:** Signature doesn't match eSewa's validation

**Solutions:**
1. **Verify .env variables are set correctly:**
   ```
   ESEWA_PRODUCT_CODE=EPAYTEST
   ESEWA_SECRET_KEY=8gBm/:&EnhH.1/q
   ```

2. **Restart the backend server** after updating .env

3. **Check server console logs** for the signature debug info:
   ```
   === Test eSewa Payment Debug Info ===
   Product Code: EPAYTEST
   Secret Key: 8gBm/:&EnhH.1/q
   Signature Message: total_amount=...,transaction_uuid=...,product_code=EPAYTEST
   Signature: ...base64-signature...
   ```

4. **Verify amount formatting:**
   - All amounts must have exactly 2 decimal places
   - Example: "100.00" not "100" or "100.0"

5. **Check transaction UUID format:**
   - Must not contain special characters except hyphens
   - Format: TEST-1710528345123-ABC123

---

## Notes

- Test amounts work on eSewa sandbox
- Transactions are NOT persisted to database (test mode only)
- UUIDs are generated with TEST prefix for easy identification
- Success/Failure URLs are automatically constructed
- All amounts are auto-formatted to 2 decimal places

---

## Transitioning to Production

1. Update `.env`:
   ```env
   ESEWA_ENV=live
   ESEWA_PRODUCT_CODE=your_live_product_code
   ESEWA_SECRET_KEY=your_live_secret_key
   ```

2. Switch to actual order endpoints (not test endpoints)

3. Verify payment handling for actual orders

4. Test fully with small amounts first

