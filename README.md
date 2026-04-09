
# mpesa-sdk-js
![npm version](https://img.shields.io/npm/v/adams-mpesa-sdk.svg)
![Build Status](https://img.shields.io/badge/tests-49%20passing-brightgreen.svg)
![TypeScript](https://img.shields.io/badge/TypeScript-5.3+-blue.svg)

A type-safe Node.js client for Safaricom Daraja API. This library handles OAuth2 token lifecycles, request retries with exponential backoff, and provides middleware for parsing nested callback data.

[Quick Start](#quick-start) • [Callback Handling](#callback-handling) • [Error Handling](#error-handling) • [Configuration](#configuration)

---

## Installation

```bash
npm install adams-mpesa-sdk
```

## Quick Start

### Initialization
```typescript
import Mpesa from 'adams-mpesa-sdk';

const mpesa = new Mpesa({
  consumerKey: process.env.MPESA_CONSUMER_KEY,
  consumerSecret: process.env.MPESA_CONSUMER_SECRET,
  shortcode: process.env.MPESA_SHORTCODE,
  passkey: process.env.MPESA_PASSKEY,
  environment: 'sandbox' // or 'production'
});
```

### STK Push (Lipa Na M-Pesa Online)
```typescript
const response = await mpesa.stkPush({
  amount: 100,
  phone: '0712345678', // Automatically normalized to 254712345678
  accountReference: 'REF-001',
  transactionDesc: 'Order Payment',
  callbackUrl: '[https://api.example.com/hooks/mpesa](https://api.example.com/hooks/mpesa)'
});

console.log(response.CheckoutRequestID);
```

---

## Callback Handling

The SDK includes Express middleware to flatten the standard MPesa response body into a usable object.

```typescript
import { mpesaCallbackMiddleware, MpesaRequest } from 'adams-mpesa-sdk';

app.post('/hooks/mpesa', mpesaCallbackMiddleware(), (req: MpesaRequest, res) => {
  const { mpesa } = req;

  if (mpesa?.ResultCode === 0) {
    // Access flattened metadata directly
    const { Amount, MpesaReceiptNumber, PhoneNumber } = mpesa.metadata;
    // Process successful transaction logic here
  }

  res.status(200).json({ ResultCode: 0, ResultDesc: 'Accepted' });
});
```

---

## Error Handling

The library exports custom error classes for granular catching.

```typescript
try {
  await mpesa.stkPush({...});
} catch (error) {
  if (error instanceof MpesaAuthError) {
    // Issues with Consumer Key/Secret or Daraja availability
  } else if (error instanceof InvalidPhoneNumberError) {
    // Phone format failed pre-request validation
  } else if (error instanceof MpesaResponseError) {
    // API returned a non-200 status
    console.error(error.message, error.resultCode);
  }
}
```

---

## Configuration

| Property | Type | Default | Description |
| :--- | :--- | :--- | :--- |
| `maxRetries` | `number` | `3` | Retries for 5xx errors or rate limits (429). |
| `timeout` | `number` | `30000` | Request timeout in milliseconds. |
| `autoRefreshToken`| `boolean`| `true` | Refresh token 60s before expiration. |

---

## Technical Features

* **Token Caching**: Tokens are stored in-memory and reused until they are within 60 seconds of expiration.
* **Phone Normalization**: Supports `07xx`, `254xx`, `+254xx`, and `7xx` formats.
* **Automatic Retries**: Implements exponential backoff for transient network issues or Safaricom system maintenance windows.
* **Type Definitions**: Full TypeScript support for all request payloads and response bodies.

---

## Testing

Run the test suite:
```bash
npm test
```

For live sandbox testing:
1. Copy `.env.example` to `.env`
2. Provide your Daraja sandbox credentials
3. Run `npm run test:live`

---

**Author**: [Adams Mugwe](https://github.com/ADAMSmugwe)  
**License**: MIT
```
