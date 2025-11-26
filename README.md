# Adams MPesa SDK 🚀

A modern, production-grade MPesa API Wrapper/SDK for Node.js with full TypeScript support. Built for developers who want a clean, simple, and reliable way to integrate MPesa payments into their applications.

[![npm version](https://img.shields.io/npm/v/adams-mpesa-sdk.svg)](https://www.npmjs.com/package/adams-mpesa-sdk)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![TypeScript](https://img.shields.io/badge/TypeScript-Ready-blue.svg)](https://www.typescriptlang.org/)

## ✨ Features

- 🔒 **Secure OAuth Token Management** - Automatic token generation, caching, and refresh
- 📱 **STK Push** - Lipa Na MPesa Online (initiate & query)
- 💰 **C2B** - Customer to Business (register URLs & simulate payments)
- 💸 **B2C** - Business to Customer (payouts)
- 🔍 **Transaction Status** - Query any transaction status
- 🔄 **Automatic Retries** - Configurable retry logic with exponential backoff
- ✅ **Input Validation** - Comprehensive validation for all inputs
- 🎯 **TypeScript First** - Full type definitions included
- 🧪 **Well Tested** - Extensive test coverage
- 📖 **Excellent DX** - Clean API, detailed error messages

## 📦 Installation

```bash
npm install adams-mpesa-sdk
```

Or with yarn:

```bash
yarn add adams-mpesa-sdk
```

## 🚀 Quick Start

### TypeScript

```typescript
import { Mpesa } from 'adams-mpesa-sdk';

const mpesa = new Mpesa({
  consumerKey: 'YOUR_CONSUMER_KEY',
  consumerSecret: 'YOUR_CONSUMER_SECRET',
  shortcode: '174379',
  passkey: 'YOUR_PASSKEY',
  environment: 'sandbox', // or 'production'
});

// Initiate STK Push
const response = await mpesa.stkPush({
  amount: 100,
  phone: '254712345678',
  accountReference: 'Invoice #123',
  transactionDesc: 'Payment for order #123',
  callbackUrl: 'https://yourdomain.com/callback',
});

console.log(response);
```

### JavaScript (CommonJS)

```javascript
const { Mpesa } = require('adams-mpesa-sdk');

const mpesa = new Mpesa({
  consumerKey: process.env.MPESA_CONSUMER_KEY,
  consumerSecret: process.env.MPESA_CONSUMER_SECRET,
  shortcode: process.env.MPESA_SHORTCODE,
  passkey: process.env.MPESA_PASSKEY,
  environment: 'sandbox',
});

// Use async/await
(async () => {
  try {
    const response = await mpesa.stkPush({
      amount: 100,
      phone: '0712345678',
      accountReference: 'Test Payment',
    });
    console.log('Success:', response);
  } catch (error) {
    console.error('Error:', error.message);
  }
})();
```

## 📚 Configuration

### Required Configuration

```typescript
interface MpesaConfig {
  consumerKey: string;      // From Safaricom Developer Portal
  consumerSecret: string;   // From Safaricom Developer Portal
  shortcode: string;        // Your paybill/till number
  passkey: string;          // For STK Push
  environment: 'sandbox' | 'production';
}
```

### Optional Configuration

```typescript
interface MpesaConfig {
  // ... required fields
  initiatorName?: string;        // For B2C transactions
  securityCredential?: string;   // For B2C transactions
  autoRefreshToken?: boolean;    // Default: true
  maxRetries?: number;           // Default: 3
  timeout?: number;              // Default: 30000 (30 seconds)
}
```

### Environment Variables

Create a `.env` file in your project root:

```env
MPESA_CONSUMER_KEY=your_consumer_key
MPESA_CONSUMER_SECRET=your_consumer_secret
MPESA_SHORTCODE=174379
MPESA_PASSKEY=your_passkey
MPESA_ENVIRONMENT=sandbox
```

Then use it in your code:

```typescript
import * as dotenv from 'dotenv';
dotenv.config();

const mpesa = new Mpesa({
  consumerKey: process.env.MPESA_CONSUMER_KEY!,
  consumerSecret: process.env.MPESA_CONSUMER_SECRET!,
  shortcode: process.env.MPESA_SHORTCODE!,
  passkey: process.env.MPESA_PASSKEY!,
  environment: process.env.MPESA_ENVIRONMENT as 'sandbox' | 'production',
});
```

## 🎯 API Reference

### STK Push (Lipa Na MPesa Online)

#### Initiate STK Push

```typescript
const response = await mpesa.stkPush({
  amount: 100,
  phone: '254712345678',           // or '0712345678'
  accountReference: 'INV-001',
  transactionDesc: 'Payment',      // Optional
  callbackUrl: 'https://...',      // Optional
});
```

**Response:**
```typescript
{
  MerchantRequestID: "29115-34620561-1",
  CheckoutRequestID: "ws_CO_191220191020363925",
  ResponseCode: "0",
  ResponseDescription: "Success. Request accepted for processing",
  CustomerMessage: "Success. Request accepted for processing"
}
```

#### Query STK Push Status

```typescript
const status = await mpesa.stkQuery({
  checkoutRequestId: 'ws_CO_191220191020363925',
});
```

**Response:**
```typescript
{
  ResponseCode: "0",
  ResponseDescription: "The service request has been accepted successsfully",
  MerchantRequestID: "29115-34620561-1",
  CheckoutRequestID: "ws_CO_191220191020363925",
  ResultCode: "0",
  ResultDesc: "The service request is processed successfully."
}
```

### C2B (Customer to Business)

#### Register URLs

```typescript
const response = await mpesa.c2bRegister({
  validationUrl: 'https://yourdomain.com/mpesa/validate',
  confirmationUrl: 'https://yourdomain.com/mpesa/confirm',
  responseType: 'Completed', // or 'Cancelled'
});
```

#### Simulate C2B Payment (Sandbox Only)

```typescript
const response = await mpesa.c2bSimulate({
  amount: 100,
  phone: '254712345678',
  billRefNumber: 'INVOICE-001',
  commandId: 'CustomerPayBillOnline', // or 'CustomerBuyGoodsOnline'
});
```

### B2C (Business to Customer)

```typescript
const response = await mpesa.b2c({
  amount: 100,
  phone: '254712345678',
  commandId: 'BusinessPayment', // or 'SalaryPayment', 'PromotionPayment'
  remarks: 'Monthly salary',
  occasion: 'Salary',
  resultUrl: 'https://yourdomain.com/result',
  timeoutUrl: 'https://yourdomain.com/timeout',
});
```

### Transaction Status

```typescript
const status = await mpesa.transactionStatus({
  transactionId: 'OEI2AK4Q16',
  remarks: 'Query status',
  resultUrl: 'https://yourdomain.com/result',
  timeoutUrl: 'https://yourdomain.com/timeout',
});
```

### Token Management

```typescript
// Get current access token
const token = await mpesa.getAccessToken();

// Force refresh token
const newToken = await mpesa.refreshAccessToken();

// Clear cached token
mpesa.clearTokenCache();

// Get token expiry time
const expiry = mpesa.getTokenExpiry();
```

## 📞 Phone Number Formats

The SDK automatically formats phone numbers. All these formats are accepted:

- `254712345678` ✅
- `0712345678` ✅
- `712345678` ✅
- `+254712345678` ✅
- `0712-345-678` ✅
- `0712 345 678` ✅

## 🔔 Handling Callbacks

### Express.js Example

```typescript
import express from 'express';
import { Mpesa } from 'adams-mpesa-sdk';

const app = express();
app.use(express.json());

app.post('/mpesa/callback', (req, res) => {
  const { Body } = req.body;
  
  if (Body.stkCallback) {
    const { MerchantRequestID, CheckoutRequestID, ResultCode, ResultDesc } = Body.stkCallback;
    
    if (ResultCode === 0) {
      // Payment successful
      console.log('Payment successful:', CheckoutRequestID);
      
      // Extract payment details
      const metadata = Body.stkCallback.CallbackMetadata?.Item;
      const amount = metadata?.find(item => item.Name === 'Amount')?.Value;
      const phone = metadata?.find(item => item.Name === 'PhoneNumber')?.Value;
      const transactionId = metadata?.find(item => item.Name === 'MpesaReceiptNumber')?.Value;
      
      console.log({ amount, phone, transactionId });
    } else {
      // Payment failed
      console.log('Payment failed:', ResultDesc);
    }
  }
  
  res.status(200).json({ ResultCode: 0, ResultDesc: 'Accepted' });
});

app.listen(3000, () => console.log('Server running on port 3000'));
```

## ❌ Error Handling

The SDK provides specific error types for better error handling:

```typescript
import {
  MpesaError,
  MpesaNetworkError,
  MpesaAuthError,
  InvalidPhoneNumberError,
  MissingConfigError,
  ValidationError,
} from 'adams-mpesa-sdk';

try {
  const response = await mpesa.stkPush({
    amount: 100,
    phone: '254712345678',
    accountReference: 'Test',
  });
} catch (error) {
  if (error instanceof InvalidPhoneNumberError) {
    console.error('Invalid phone number format');
  } else if (error instanceof MpesaAuthError) {
    console.error('Authentication failed. Check your credentials');
  } else if (error instanceof MpesaNetworkError) {
    console.error('Network error. Please try again');
  } else if (error instanceof ValidationError) {
    console.error('Validation error:', error.message);
  } else {
    console.error('Unexpected error:', error);
  }
}
```

## 🐛 Common Issues & Solutions

### 1. "Invalid Access Token"

**Problem:** Token has expired or is invalid.

**Solution:**
```typescript
mpesa.clearTokenCache();
const newToken = await mpesa.refreshAccessToken();
```

### 2. "Invalid Phone Number"

**Problem:** Phone number format is incorrect.

**Solution:** Ensure phone number starts with 254 and has 12 digits total, or starts with 0/7 for local format.

### 3. "The service request has not been accepted"

**Problem:** MPesa API rejected the request.

**Solutions:**
- Check if your shortcode is registered for STK Push
- Verify your passkey is correct
- Ensure callback URL is publicly accessible (not localhost)
- For production, ensure URLs use HTTPS

### 4. "Request failed with status code 401"

**Problem:** Invalid consumer key or secret.

**Solution:** Double-check your credentials from the Safaricom Developer Portal.

### 5. Callback URL Not Receiving Requests

**Problem:** MPesa cannot reach your callback URL.

**Solutions:**
- Use a public URL (not localhost)
- Use HTTPS (required for production)
- Test with services like ngrok during development
- Ensure your server is running and port is open

## 🧪 Testing

```bash
# Install dependencies
npm install

# Run tests
npm test

# Run tests with coverage
npm run test:coverage

# Run tests in watch mode
npm run test:watch
```

## 🏗️ Building

```bash
# Build the project
npm run build

# Lint code
npm run lint

# Format code
npm run format
```

## 🤝 Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🔗 Links

- [Safaricom Developer Portal](https://developer.safaricom.co.ke/)
- [MPesa API Documentation](https://developer.safaricom.co.ke/Documentation)
- [GitHub Repository](https://github.com/yourusername/adams-mpesa-sdk)

## 💬 Support

For support, email support@example.com or open an issue on GitHub.

## ⚠️ Disclaimer

This SDK is not officially affiliated with or endorsed by Safaricom. Use at your own risk.

---

Made with ❤️ by Adams
