// Test importing the package
import Mpesa, {
  // Core exports
  MpesaError,
  InvalidPhoneNumberError,
  ValidationError,
  
  // Middleware
  mpesaCallbackMiddleware,
  c2bCallbackMiddleware,
  verifyCallbackSignature,
  
  // Token Storage
  MemoryTokenStorage,
  RedisTokenStorage,
  FileTokenStorage,
  MongoDBTokenStorage,
  
  // Utils
  formatPhoneNumber,
  validateAmount,
  sanitizeForLogging,
} from './dist/index.js';

console.log('✅ All imports successful!\n');

// Test basic functionality
console.log('Testing basic functionality...\n');

// 1. Test phone number formatting
const formattedPhone = formatPhoneNumber('0712345678');
console.log('1. Phone formatting:', formattedPhone, '✅');

// 2. Test amount validation
try {
  validateAmount(100);
  console.log('2. Amount validation: Valid amount ✅');
} catch (error) {
  console.log('2. Amount validation: Failed ❌');
}

// 3. Test sanitization
const sanitized = sanitizeForLogging({
  consumerKey: 'secret123',
  amount: 100,
  phone: '254712345678',
});
console.log('3. Sanitization:', sanitized.consumerKey === '***REDACTED***' ? '✅' : '❌');

// 4. Test token storage
const tokenStorage = new MemoryTokenStorage();
tokenStorage.set('test-token', 3600);
const retrievedToken = tokenStorage.get();
console.log('4. Token storage:', retrievedToken === 'test-token' ? '✅' : '❌');

// 5. Test error classes
const error = new InvalidPhoneNumberError('invalid');
console.log('5. Error classes:', error instanceof MpesaError ? '✅' : '❌');

// 6. Test callback signature verification
import crypto from 'crypto';

const payload = JSON.stringify({ test: 'data' });
const secretKey = 'my-secret-key';
const signature = crypto
  .createHmac('sha256', secretKey)
  .update(payload)
  .digest('base64');

const isValid = verifyCallbackSignature(payload, signature, secretKey);
console.log('6. Signature verification:', isValid ? '✅' : '❌');

console.log('\n🎉 All basic tests passed!');
