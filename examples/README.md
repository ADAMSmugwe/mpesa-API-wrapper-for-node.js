# Examples

This folder contains complete, working examples demonstrating how to use the Adams MPesa SDK.

## Running the Examples

All examples use TypeScript and can be run with `ts-node`:

```bash
npm install -D ts-node
```

Make sure you have your `.env` file configured with valid MPesa credentials.

## Available Examples

### 1. Express STK Push Server (`express-stk-push.ts`)

A complete Express.js REST API server implementing:
- Payment initiation endpoint
- Payment status query endpoint
- Error handling
- Input validation

**Run:**
```bash
npx ts-node examples/express-stk-push.ts
```

**Endpoints:**
- `POST /api/payment/initiate` - Initiate STK Push
- `GET /api/payment/:checkoutRequestId/status` - Query payment status

### 2. Callback Handling (`callback-handling.ts`)

Comprehensive callback/webhook handling examples:
- STK Push callbacks with middleware
- Secure callbacks with signature verification
- C2B validation endpoint
- C2B confirmation endpoint
- Automatic metadata extraction

**Run:**
```bash
npx ts-node examples/callback-handling.ts
```

**Endpoints:**
- `POST /api/mpesa/stk-callback` - STK Push callback
- `POST /api/mpesa/stk-callback-secure` - Secure STK callback with signature verification
- `POST /api/mpesa/c2b-validation` - C2B validation
- `POST /api/mpesa/c2b-confirmation` - C2B confirmation

### 3. Error Handling (`error-handling.ts`)

Comprehensive error handling strategies:
- Basic error handling
- Handling specific error types
- Retry logic demonstration
- Graceful error handling for production
- Error logging and monitoring

**Run:**
```bash
npx ts-node examples/error-handling.ts
```

## Example Request/Response

### Initiate Payment

```bash
curl -X POST http://localhost:3000/api/payment/initiate \
  -H "Content-Type: application/json" \
  -d '{
    "amount": 100,
    "phone": "254712345678",
    "accountReference": "ORDER-123",
    "description": "Payment for Order #123"
  }'
```

**Response:**
```json
{
  "success": true,
  "message": "Payment initiated. Check your phone for MPesa prompt.",
  "data": {
    "checkoutRequestId": "ws_CO_27112025130000123456789",
    "merchantRequestId": "1234-5678-9012-3456",
    "responseCode": "0",
    "responseDescription": "Success. Request accepted for processing",
    "customerMessage": "Success. Request accepted for processing"
  }
}
```

## Testing Callbacks Locally

Use [ngrok](https://ngrok.com/) to expose your local server for callback testing:

```bash
# Start ngrok
ngrok http 3000

# Update your .env with the ngrok URL
CALLBACK_URL=https://your-ngrok-url.ngrok.io/api/mpesa/callback

# Run your example
npx ts-node examples/callback-handling.ts
```

## Notes

- All examples require valid MPesa credentials in `.env`
- For sandbox testing, use the test credentials from Safaricom Developer Portal
- Callbacks require publicly accessible HTTPS URLs (use ngrok for local development)
- The SDK automatically retries failed requests with exponential backoff

## Need Help?

- Check the main [README.md](../README.md) for full documentation
- Review the [QUICKSTART.md](../QUICKSTART.md) for getting started guide
- Open an issue on [GitHub](https://github.com/ADAMSmugwe/mpesa-API-wrapper-for-node.js/issues)
