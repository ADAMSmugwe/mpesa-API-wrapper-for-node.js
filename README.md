<div align="center">

# 🚀 Adams MPesa SDK for Node.js

### Modern, Production-Ready MPesa API Integration for Node.js & TypeScript

[![npm version](https://img.shields.io/npm/v/adams-mpesa-sdk.svg)](https://www.npmjs.com/package/adams-mpesa-sdk)
[![Node.js Version](https://img.shields.io/node/v/adams-mpesa-sdk.svg)](https://nodejs.org)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.3+-blue.svg)](https://www.typescriptlang.org/)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![Build Status](https://img.shields.io/badge/build-passing-brightgreen.svg)](https://github.com/ADAMSmugwe/mpesa-API-wrapper-for-node.js)
[![Tests](https://img.shields.io/badge/tests-49%20passing-brightgreen.svg)](https://github.com/ADAMSmugwe/mpesa-API-wrapper-for-node.js)

[Features](#-features) • [Installation](#-installation) • [Quick Start](#-quick-start) • [Documentation](#-documentation) • [Examples](#-usage-examples) • [Contributing](#-contributing)

</div>

---

## 📖 Description

**Adams MPesa SDK** is a comprehensive, developer-friendly Node.js library for integrating Safaricom's MPesa Daraja API into your applications. Built with TypeScript and designed for production use, it provides a clean, intuitive interface for all MPesa payment operations.

Whether you're building an e-commerce platform, a SaaS application, or a mobile money service in Kenya, this SDK handles the complexity of MPesa integration so you can focus on building your product.

### Why Choose This SDK?

- ✅ **Type-Safe**: Full TypeScript support with comprehensive type definitions
- ✅ **Production-Ready**: Robust error handling, automatic retries, and token caching
- ✅ **Developer-Friendly**: Clean API, extensive documentation, and working examples
- ✅ **Well-Tested**: 49 passing unit tests with comprehensive coverage
- ✅ **Modern**: Uses latest Node.js features and best practices
- ✅ **Zero Config**: Sensible defaults that work out of the box

---

## ✨ Features

### Core Functionality
- 🔐 **OAuth Token Management** - Automatic generation, caching, and refresh
- 💳 **STK Push (Lipa Na M-Pesa Online)** - Initiate and query customer payments
- 💰 **C2B Payments** - URL registration and payment simulation
- 💸 **B2C Payments** - Send money to customers (salary, refunds, etc.)
- 📊 **Transaction Status** - Query any transaction status

### Developer Experience
- ✨ **Full TypeScript Support** - Complete type definitions for all APIs
- 🔄 **Automatic Retries** - Exponential backoff for failed requests
- ✅ **Input Validation** - Phone numbers, amounts, URLs validated automatically
- 🎯 **Custom Error Types** - Detailed, actionable error messages
- 📱 **Phone Number Formatting** - Supports multiple formats (0712..., +254..., 254...)
- 🌍 **Environment Support** - Seamless switching between sandbox and production

### Production Features
- ⚡ **Token Caching** - Minimizes unnecessary API calls
- 🔒 **Secure** - Follows security best practices
- 📝 **Comprehensive Logging** - Debug-friendly error messages
- 🧪 **Fully Tested** - 49 unit tests ensuring reliability
- 📦 **Dual Module System** - Supports both CommonJS and ES Modules

---

## 📦 Installation

```bash
npm install adams-mpesa-sdk
```

Or using yarn:

```bash
yarn add adams-mpesa-sdk
```

### Requirements
- Node.js >= 16.0.0
- npm or yarn
- Safaricom Daraja API credentials ([Get them here](https://developer.safaricom.co.ke))

---

## 🚀 Quick Start

### 1. Get Your Credentials

Before you begin, sign up at [Safaricom Developer Portal](https://developer.safaricom.co.ke) and create an app to get:
- Consumer Key
- Consumer Secret  
- Business Shortcode
- Lipa Na M-Pesa Online Passkey

### 2. Set Up Environment Variables

Create a `.env` file in your project root:

```env
MPESA_CONSUMER_KEY=your_consumer_key_here
MPESA_CONSUMER_SECRET=your_consumer_secret_here
MPESA_SHORTCODE=174379
MPESA_PASSKEY=your_passkey_here
MPESA_ENVIRONMENT=sandbox
```

### 3. Initialize the SDK

#### TypeScript
```typescript
import Mpesa from 'adams-mpesa-sdk';
import 'dotenv/config';

const mpesa = new Mpesa({
  consumerKey: process.env.MPESA_CONSUMER_KEY!,
  consumerSecret: process.env.MPESA_CONSUMER_SECRET!,
  shortcode: process.env.MPESA_SHORTCODE!,
  passkey: process.env.MPESA_PASSKEY!,
  environment: 'sandbox', // or 'production'
});
```

#### JavaScript (CommonJS)
```javascript
const Mpesa = require('adams-mpesa-sdk').default;
require('dotenv/config');

const mpesa = new Mpesa({
  consumerKey: process.env.MPESA_CONSUMER_KEY,
  consumerSecret: process.env.MPESA_CONSUMER_SECRET,
  shortcode: process.env.MPESA_SHORTCODE,
  passkey: process.env.MPESA_PASSKEY,
  environment: 'sandbox',
});
```

---

## 💡 Usage Examples

### STK Push (Lipa Na M-Pesa Online)

Prompt customers to pay via MPesa:

```typescript
async function initiatePayment() {
  try {
    const response = await mpesa.stkPush({
      amount: 100,
      phone: '254712345678', // Supports multiple formats
      accountReference: 'ORDER-123',
      transactionDesc: 'Payment for Order #123',
      callbackUrl: 'https://yourdomain.com/api/mpesa/callback',
    });

    console.log('Payment initiated:', response.CheckoutRequestID);
    // Customer will receive MPesa prompt on their phone
  } catch (error) {
    console.error('Payment failed:', error.message);
  }
}
```

### Query STK Push Status

Check the status of a payment request:

```typescript
async function checkPaymentStatus(checkoutRequestId: string) {
  try {
    const response = await mpesa.stkQuery({
      checkoutRequestId: checkoutRequestId,
    });

    if (response.ResultCode === '0') {
      console.log('Payment successful!');
    } else {
      console.log('Payment failed:', response.ResultDesc);
    }
  } catch (error) {
    console.error('Query failed:', error.message);
  }
}
```

### B2C Payment (Send Money to Customers)

Send money for salaries, refunds, or promotions:

```typescript
async function sendMoney() {
  try {
    const response = await mpesa.b2c({
      amount: 500,
      phone: '254712345678',
      commandId: 'BusinessPayment', // or 'SalaryPayment', 'PromotionPayment'
      occasion: 'Salary Payment',
      remarks: 'Monthly salary',
      resultUrl: 'https://yourdomain.com/api/mpesa/b2c/result',
      timeoutUrl: 'https://yourdomain.com/api/mpesa/b2c/timeout',
    });

    console.log('Transfer initiated:', response.ConversationID);
  } catch (error) {
    console.error('Transfer failed:', error.message);
  }
}
```

### C2B URL Registration

Register URLs for receiving customer payments:

```typescript
async function registerC2BUrls() {
  try {
    const response = await mpesa.c2bRegister({
      validationUrl: 'https://yourdomain.com/api/mpesa/validation',
      confirmationUrl: 'https://yourdomain.com/api/mpesa/confirmation',
      responseType: 'Completed', // or 'Cancelled'
    });

    console.log('URLs registered successfully');
  } catch (error) {
    console.error('Registration failed:', error.message);
  }
}
```

For more examples, see the [examples.ts](./examples.ts) file.

---

## ⚙️ Configuration

### Required Configuration

| Parameter | Type | Description |
|-----------|------|-------------|
| `consumerKey` | string | Consumer Key from Daraja Portal |
| `consumerSecret` | string | Consumer Secret from Daraja Portal |
| `shortcode` | string | Your business shortcode (Paybill or Till) |
| `passkey` | string | Lipa Na M-Pesa Online Passkey |
| `environment` | `'sandbox'` \| `'production'` | API environment |

### Optional Configuration

| Parameter | Type | Default | Description |
|-----------|------|---------|-------------|
| `initiatorName` | string | - | Required for B2C and Transaction Status |
| `securityCredential` | string | - | Required for B2C and Transaction Status |
| `autoRefreshToken` | boolean | `true` | Automatically refresh expired tokens |
| `maxRetries` | number | `3` | Maximum retry attempts for failed requests |
| `timeout` | number | `30000` | Request timeout in milliseconds |

---

## 🎯 Callback / Webhook Handling

MPesa sends callbacks to your server for async operations. Here's a complete Express.js example:

```typescript
import express from 'express';
import Mpesa from 'adams-mpesa-sdk';

const app = express();
app.use(express.json());

// STK Push Callback
app.post('/api/mpesa/callback', (req, res) => {
  const { Body } = req.body;
  const { stkCallback } = Body;

  if (stkCallback.ResultCode === 0) {
    // Payment successful
    const { CallbackMetadata } = stkCallback;
    const amount = CallbackMetadata.Item.find((item: any) => item.Name === 'Amount')?.Value;
    const mpesaRef = CallbackMetadata.Item.find((item: any) => item.Name === 'MpesaReceiptNumber')?.Value;
    
    console.log(`Payment of ${amount}. Ref: ${mpesaRef}`);
  } else {
    console.log('Payment failed:', stkCallback.ResultDesc);
  }

  res.json({ ResultCode: 0, ResultDesc: 'Success' });
});

app.listen(3000, () => console.log('Server running'));
```

---

## 🚨 Error Handling

The SDK provides detailed error types:

```typescript
import {
  MpesaError,
  MpesaAuthError,
  MpesaResponseError,
  ValidationError,
  InvalidPhoneNumberError,
} from 'adams-mpesa-sdk';

try {
  await mpesa.stkPush({...});
} catch (error) {
  if (error instanceof InvalidPhoneNumberError) {
    console.error('Invalid phone number format');
  } else if (error instanceof MpesaAuthError) {
    console.error('Authentication failed');
  } else if (error instanceof MpesaResponseError) {
    console.error('MPesa API error:', error.message);
  }
}
```

### Common Errors and Solutions

| Error | Cause | Solution |
|-------|-------|----------|
| `Invalid Access Token` | App not subscribed to API | Subscribe to the API product in Daraja Portal |
| `Invalid Shortcode` | Wrong business shortcode | Verify your shortcode in Daraja Portal |
| `Invalid Phone Number` | Wrong phone format | Use format: 254XXXXXXXXX |

---

## 📚 Documentation

For more detailed information:

- [Quick Start Guide](./QUICKSTART.md)
- [Project Summary](./PROJECT_SUMMARY.md)
- [Examples File](./examples.ts)
- [Safaricom Developer Portal](https://developer.safaricom.co.ke)

---

## 🧪 Testing

```bash
# Run unit tests
npm test

# Run tests with coverage
npm run test:coverage

# Run live API tests (requires credentials)
npm run test:live
```

### Live Testing Scripts

```bash
# Test OAuth token generation
npx ts-node test-token-only.ts

# Test STK Push
npx ts-node test-stk-push.ts
```

---

## 🤝 Contributing

We welcome contributions! Here's how you can help:

### Reporting Issues

- Use the [GitHub Issues](https://github.com/ADAMSmugwe/mpesa-API-wrapper-for-node.js/issues) page
- Provide a clear description and steps to reproduce
- Include error messages and stack traces

### Pull Requests

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

### Development Guidelines

- Write tests for new features
- Follow the existing code style
- Update documentation for API changes
- Ensure all tests pass before submitting

---

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

---

## 💬 Support & Contact

- **GitHub Issues**: [Report bugs or request features](https://github.com/ADAMSmugwe/mpesa-API-wrapper-for-node.js/issues)
- **Email**: mugweadams439@gmail.com
- **GitHub**: [@ADAMSmugwe](https://github.com/ADAMSmugwe)

---

## 🙏 Acknowledgments

- [Safaricom Daraja API](https://developer.safaricom.co.ke) - Official MPesa API
- All contributors and users of this SDK
- The Node.js and TypeScript communities

---

## 🌟 Show Your Support

If this SDK helped you build something awesome, please:

- ⭐ Star this repository
- 🐛 Report issues
- 💡 Suggest new features
- 🤝 Contribute code
- 📢 Share with other developers

---

<div align="center">

### 🎉 Happy Coding! 🎉

**Built with ❤️ for the Kenyan developer community**

Made by [Adams Mugwe](https://github.com/ADAMSmugwe) • [Repository](https://github.com/ADAMSmugwe/mpesa-API-wrapper-for-node.js)

</div>
