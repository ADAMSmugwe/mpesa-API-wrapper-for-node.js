# Quick Start Guide - Adams MPesa SDK

This guide will help you get started with the Adams MPesa SDK in just a few minutes.

## Prerequisites

- Node.js 16 or higher
- NPM or Yarn
- Safaricom Developer Account ([Sign up here](https://developer.safaricom.co.ke))

## Step 1: Get Your Credentials

1. Go to [Safaricom Developer Portal](https://developer.safaricom.co.ke)
2. Create a new app or use an existing one
3. Note down your:
   - Consumer Key
   - Consumer Secret
   - Shortcode (Business Number)
   - Passkey (for STK Push)

## Step 2: Installation

```bash
npm install adams-mpesa-sdk
```

## Step 3: Basic Setup

Create a `.env` file in your project root:

```env
MPESA_CONSUMER_KEY=your_consumer_key_here
MPESA_CONSUMER_SECRET=your_consumer_secret_here
MPESA_SHORTCODE=174379
MPESA_PASSKEY=your_passkey_here
MPESA_ENVIRONMENT=sandbox
```

## Step 4: Your First Payment

Create a file `mpesa-test.js`:

```javascript
const { Mpesa } = require('adams-mpesa-sdk');
require('dotenv').config();

const mpesa = new Mpesa({
  consumerKey: process.env.MPESA_CONSUMER_KEY,
  consumerSecret: process.env.MPESA_CONSUMER_SECRET,
  shortcode: process.env.MPESA_SHORTCODE,
  passkey: process.env.MPESA_PASSKEY,
  environment: process.env.MPESA_ENVIRONMENT,
});

async function testPayment() {
  try {
    const response = await mpesa.stkPush({
      amount: 1,
      phone: '254712345678', // Replace with your phone number
      accountReference: 'Test Payment',
      transactionDesc: 'Testing MPesa SDK',
      callbackUrl: 'https://yourdomain.com/callback', // Optional
    });

    console.log('Success! Check your phone for the payment prompt.');
    console.log('Response:', response);
  } catch (error) {
    console.error('Error:', error.message);
  }
}

testPayment();
```

Run it:

```bash
node mpesa-test.js
```

## Step 5: Handle the Callback (Optional)

If you're building a web application, create an endpoint to receive payment confirmations:

```javascript
const express = require('express');
const app = express();

app.use(express.json());

app.post('/api/mpesa/callback', (req, res) => {
  const { Body } = req.body;
  
  if (Body.stkCallback) {
    const { ResultCode, CheckoutRequestID, ResultDesc } = Body.stkCallback;
    
    if (ResultCode === 0) {
      console.log('✅ Payment successful!', CheckoutRequestID);
      // Update your database, send confirmation email, etc.
    } else {
      console.log('❌ Payment failed:', ResultDesc);
    }
  }
  
  res.status(200).json({ ResultCode: 0, ResultDesc: 'Accepted' });
});

app.listen(3000, () => {
  console.log('Server running on http://localhost:3000');
});
```

## TypeScript Usage

For TypeScript projects:

```typescript
import { Mpesa, StkPushRequest, StkPushResponse } from 'adams-mpesa-sdk';

const mpesa = new Mpesa({
  consumerKey: process.env.MPESA_CONSUMER_KEY!,
  consumerSecret: process.env.MPESA_CONSUMER_SECRET!,
  shortcode: process.env.MPESA_SHORTCODE!,
  passkey: process.env.MPESA_PASSKEY!,
  environment: 'sandbox',
});

async function initiatePayment(): Promise<StkPushResponse> {
  const request: StkPushRequest = {
    amount: 100,
    phone: '254712345678',
    accountReference: 'Invoice #123',
  };

  return await mpesa.stkPush(request);
}
```

## Testing in Sandbox

For sandbox testing:

1. Use the Safaricom sandbox credentials
2. Use the test phone numbers provided by Safaricom
3. Test paybill: `174379`
4. You can simulate payments without real money

## Common First-Time Issues

### Issue 1: "Invalid Access Token"
**Solution:** Check your consumer key and secret are correct.

### Issue 2: "The service request has not been accepted"
**Solution:** Ensure your shortcode is registered for STK Push on the developer portal.

### Issue 3: Phone number error
**Solution:** Use format `254712345678` (254 + 9 digits without leading zero).

### Issue 4: Callback not receiving data
**Solution:** For local development, use ngrok or similar to expose your localhost:
```bash
npx ngrok http 3000
# Use the HTTPS URL as your callback URL
```

## Next Steps

- Read the full [README.md](README.md) for all features
- Check out [examples.ts](examples.ts) for more use cases
- Learn about [error handling](README.md#error-handling)
- Explore [B2C payments](README.md#b2c-business-to-customer)
- Set up [C2B](README.md#c2b-customer-to-business)

## Need Help?

- 📖 [Full Documentation](README.md)
- 🐛 [Report Issues](https://github.com/yourusername/adams-mpesa-sdk/issues)
- 💬 [Safaricom API Docs](https://developer.safaricom.co.ke/Documentation)

---

Happy coding! 🚀
