# Advanced Features Guide

This guide covers advanced features of the Adams MPesa SDK including CLI tools, token storage adapters, webhook queue processing, and framework integrations.

## 📦 Table of Contents

- [CLI Tool](#cli-tool)
- [Custom Token Storage Adapters](#custom-token-storage-adapters)
- [Webhook Queue Processing](#webhook-queue-processing)
- [Framework Integrations](#framework-integrations)

---

## 🖥️ CLI Tool

The SDK includes a powerful command-line interface for testing and interacting with MPesa API.

### Installation

The CLI is automatically available after installing the package:

```bash
npm install -g adams-mpesa-sdk
```

Or use with npx (no installation required):

```bash
npx mpesa-cli --help
```

### Configuration

Create a `.env` file in your current directory:

```env
MPESA_CONSUMER_KEY=your_consumer_key
MPESA_CONSUMER_SECRET=your_consumer_secret
MPESA_SHORTCODE=174379
MPESA_PASSKEY=your_passkey
MPESA_ENVIRONMENT=sandbox
MPESA_CALLBACK_URL=https://yourdomain.com/callback
```

### Available Commands

#### 1. STK Push

Initiate a payment request:

```bash
mpesa-cli stk-push \
  --phone 254712345678 \
  --amount 100 \
  --reference ORDER-123 \
  --description "Payment for order"
```

Options:
- `-p, --phone <number>` - Phone number (required)
- `-a, --amount <number>` - Amount to charge (required)
- `-r, --reference <text>` - Account reference (default: "CLI-Payment")
- `-d, --description <text>` - Transaction description
- `-c, --callback <url>` - Callback URL

#### 2. Query STK Push Status

Check payment status:

```bash
mpesa-cli stk-query --id ws_CO_27112025130000123456789
```

Options:
- `-i, --id <checkoutRequestId>` - Checkout Request ID (required)

#### 3. Register C2B URLs

Register validation and confirmation URLs:

```bash
mpesa-cli c2b-register \
  --validation https://yourdomain.com/validation \
  --confirmation https://yourdomain.com/confirmation
```

Options:
- `-v, --validation <url>` - Validation URL
- `-c, --confirmation <url>` - Confirmation URL
- `-t, --response-type <type>` - Response type (Completed/Cancelled)

#### 4. B2C Payment

Send money to customers:

```bash
mpesa-cli b2c \
  --phone 254712345678 \
  --amount 500 \
  --type SalaryPayment \
  --occasion "Monthly Salary" \
  --remarks "Salary for November"
```

Options:
- `-p, --phone <number>` - Phone number (required)
- `-a, --amount <number>` - Amount to send (required)
- `-t, --type <commandId>` - Payment type (BusinessPayment/SalaryPayment/PromotionPayment)
- `-o, --occasion <text>` - Occasion
- `-r, --remarks <text>` - Remarks

#### 5. Generate Token

Get OAuth access token:

```bash
mpesa-cli token
```

#### 6. View Configuration

Display current configuration:

```bash
mpesa-cli config
```

---

## 🔐 Custom Token Storage Adapters

By default, the SDK stores OAuth tokens in memory. For production applications, you can use custom storage adapters.

### Available Adapters

#### 1. Memory Storage (Default)

```typescript
import Mpesa, { MemoryTokenStorage } from 'adams-mpesa-sdk';

const tokenStorage = new MemoryTokenStorage();
// Token is stored in application memory
// Lost on app restart
```

#### 2. Redis Storage

For distributed systems and multiple server instances:

```typescript
import Mpesa, { RedisTokenStorage } from 'adams-mpesa-sdk';
import Redis from 'ioredis';

const redis = new Redis({
  host: 'localhost',
  port: 6379,
});

const tokenStorage = new RedisTokenStorage(redis, {
  keyPrefix: 'mpesa', // Optional: default is 'mpesa:token'
});

// Use with MPesa SDK (coming in next version)
```

#### 3. File Storage

For development/testing:

```typescript
import { FileTokenStorage } from 'adams-mpesa-sdk';

const tokenStorage = new FileTokenStorage('.mpesa-token.json');
```

#### 4. MongoDB Storage

```typescript
import { MongoDBTokenStorage } from 'adams-mpesa-sdk';
import { MongoClient } from 'mongodb';

const client = new MongoClient('mongodb://localhost:27017');
await client.connect();
const collection = client.db('myapp').collection('mpesa_tokens');

const tokenStorage = new MongoDBTokenStorage(collection);
```

### Creating Custom Storage Adapter

Implement the `TokenStorage` interface:

```typescript
import { TokenStorage } from 'adams-mpesa-sdk';

export class CustomTokenStorage implements TokenStorage {
  async set(token: string, expiresIn: number): Promise<void> {
    // Store token with expiry
    // expiresIn is in seconds
  }

  async get(): Promise<string | null> {
    // Retrieve token if not expired
    // Return null if expired or not found
  }

  async clear(): Promise<void> {
    // Clear/invalidate token
  }

  async isValid(): Promise<boolean> {
    // Check if token exists and is valid
    return (await this.get()) !== null;
  }
}
```

### Usage Example

```typescript
import Mpesa from 'adams-mpesa-sdk';
import { RedisTokenStorage } from 'adams-mpesa-sdk';
import Redis from 'ioredis';

const redis = new Redis();
const tokenStorage = new RedisTokenStorage(redis);

// Configure MPesa with custom storage
// (Feature coming in v1.1.0)
```

---

## ⚡ Webhook Queue Processing

Handle high-volume MPesa callbacks with BullMQ queue processing.

### Installation

```bash
npm install bullmq ioredis
```

Ensure Redis is running:
```bash
docker run -d -p 6379:6379 redis:alpine
```

### Basic Setup

```typescript
import { MpesaWebhookQueue, processWebhook } from 'adams-mpesa-sdk';

// Create queue instance
const webhookQueue = new MpesaWebhookQueue({
  redis: {
    host: 'localhost',
    port: 6379,
  },
  queueName: 'mpesa-webhooks',
  concurrency: 5, // Process 5 jobs concurrently
  removeOnComplete: 100, // Keep last 100 completed jobs
});

// Start processing webhooks
webhookQueue.startProcessing(async (job) => {
  console.log(`Processing ${job.type}:`, job.payload);
  
  // Your business logic here
  if (job.type === 'stk_callback') {
    // Update database, send notifications, etc.
  }
}, 5); // Concurrency
```

### Express Middleware Integration

```typescript
import express from 'express';
import { MpesaWebhookQueue, mpesaQueueMiddleware } from 'adams-mpesa-sdk';

const app = express();
app.use(express.json());

const webhookQueue = new MpesaWebhookQueue();

// Use queue middleware
app.post(
  '/api/mpesa/callback',
  mpesaQueueMiddleware(webhookQueue),
  (req, res) => {
    // Response is sent immediately
    // Processing happens asynchronously
  }
);

// Start processing
webhookQueue.startProcessing(async (job) => {
  const { type, payload, timestamp } = job;
  
  switch (type) {
    case 'stk_callback':
      await handleSTKCallback(payload);
      break;
    case 'c2b_callback':
      await handleC2BCallback(payload);
      break;
  }
});
```

### Queue Statistics

```typescript
const stats = await webhookQueue.getStats();
console.log('Queue Stats:', {
  waiting: stats.waiting,
  active: stats.active,
  completed: stats.completed,
  failed: stats.failed,
  delayed: stats.delayed,
});
```

### Clean Up Old Jobs

```typescript
// Clean jobs older than 24 hours
await webhookQueue.clean(24 * 60 * 60 * 1000);
```

### Benefits

- **Scalability**: Handle thousands of callbacks per second
- **Reliability**: Automatic retries with exponential backoff
- **Monitoring**: Track job progress and failures
- **Priority**: Process urgent callbacks first
- **Distribution**: Spread load across multiple workers

---

## 🚀 Framework Integrations

### NestJS

See `examples/nestjs-integration.ts` for a complete NestJS module.

**Key Features:**
- Dependency injection
- ConfigModule integration
- RESTful controllers
- Service wrapper

**Quick Start:**

```typescript
import { MpesaModule } from './mpesa/mpesa.module';

@Module({
  imports: [MpesaModule],
})
export class AppModule {}
```

### Next.js

See `examples/nextjs-integration.ts` for App Router integration.

**Key Features:**
- API routes for payments
- Server-side only (secure)
- TypeScript support
- Client component examples

**API Routes:**
- `POST /api/mpesa/stk-push` - Initiate payment
- `GET /api/mpesa/stk-query/[id]` - Query status
- `POST /api/mpesa/callback` - Handle callbacks

---

## 🎯 Best Practices

### 1. Token Storage

- **Development**: Use MemoryTokenStorage or FileTokenStorage
- **Production**: Use RedisTokenStorage for distributed systems
- **Database**: Use MongoDBTokenStorage or create custom adapter

### 2. Webhook Processing

- **Low Traffic** (<100/min): Direct processing is fine
- **Medium Traffic** (100-1000/min): Use queue processing
- **High Traffic** (>1000/min): Use queue with multiple workers

### 3. Error Handling

Always handle errors gracefully:

```typescript
try {
  await mpesa.stkPush({...});
} catch (error) {
  if (error instanceof InvalidPhoneNumberError) {
    // Handle phone validation error
  } else if (error instanceof MpesaResponseError) {
    // Handle API error
  }
}
```

### 4. Testing

- Use sandbox for development
- Test callbacks with ngrok
- Use the CLI for quick testing
- Write unit tests for your integration

---

## 📝 Example: Production Setup

```typescript
import express from 'express';
import Mpesa, { RedisTokenStorage, MpesaWebhookQueue } from 'adams-mpesa-sdk';
import Redis from 'ioredis';

// Setup Redis
const redis = new Redis({
  host: process.env.REDIS_HOST,
  port: parseInt(process.env.REDIS_PORT || '6379'),
  password: process.env.REDIS_PASSWORD,
});

// Setup token storage
const tokenStorage = new RedisTokenStorage(redis);

// Setup webhook queue
const webhookQueue = new MpesaWebhookQueue({
  redis: {
    host: process.env.REDIS_HOST,
    port: parseInt(process.env.REDIS_PORT || '6379'),
  },
  concurrency: 10,
});

// Setup MPesa
const mpesa = new Mpesa({
  consumerKey: process.env.MPESA_CONSUMER_KEY!,
  consumerSecret: process.env.MPESA_CONSUMER_SECRET!,
  shortcode: process.env.MPESA_SHORTCODE!,
  passkey: process.env.MPESA_PASSKEY!,
  environment: 'production',
});

// Express app
const app = express();
app.use(express.json());

// Routes
app.post('/api/payment/initiate', async (req, res) => {
  try {
    const response = await mpesa.stkPush({
      amount: req.body.amount,
      phone: req.body.phone,
      accountReference: req.body.reference,
      transactionDesc: 'Payment',
    });
    res.json({ success: true, data: response });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// Callback with queue
app.post('/api/mpesa/callback', mpesaQueueMiddleware(webhookQueue));

// Process webhooks
webhookQueue.startProcessing(async (job) => {
  console.log(`Processing: ${job.type}`);
  // Update database, send notifications, etc.
}, 10);

app.listen(3000, () => {
  console.log('Server running on port 3000');
});
```

---

## 🤝 Need Help?

- **Documentation**: [GitHub README](https://github.com/ADAMSmugwe/mpesa-API-wrapper-for-node.js)
- **Issues**: [GitHub Issues](https://github.com/ADAMSmugwe/mpesa-API-wrapper-for-node.js/issues)
- **Email**: mugweadams439@gmail.com
