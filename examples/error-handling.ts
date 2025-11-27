import Mpesa, {
  MpesaError,
  MpesaAuthError,
  MpesaResponseError,
  InvalidPhoneNumberError,
  ValidationError,
  TimeoutError,
  MaxRetriesExceededError,
} from '../src/index';
import 'dotenv/config';

const mpesa = new Mpesa({
  consumerKey: process.env.MPESA_CONSUMER_KEY!,
  consumerSecret: process.env.MPESA_CONSUMER_SECRET!,
  shortcode: process.env.MPESA_SHORTCODE!,
  passkey: process.env.MPESA_PASSKEY!,
  environment: 'sandbox',
  maxRetries: 3,
  timeout: 30000,
});

async function example1_BasicErrorHandling() {
  console.log('\n=== Example 1: Basic Error Handling ===\n');
  
  try {
    await mpesa.stkPush({
      amount: 100,
      phone: 'invalid-phone',
      accountReference: 'TEST123',
      transactionDesc: 'Test Payment',
    });
  } catch (error: any) {
    console.error('❌ Error occurred:', error.message);
    console.error('Error type:', error.constructor.name);
  }
}

async function example2_SpecificErrorTypes() {
  console.log('\n=== Example 2: Handle Specific Error Types ===\n');
  
  try {
    await mpesa.stkPush({
      amount: -100,
      phone: '254712345678',
      accountReference: 'TEST123',
      transactionDesc: 'Test Payment',
    });
  } catch (error) {
    if (error instanceof InvalidPhoneNumberError) {
      console.error('❌ Phone number format is invalid');
      console.error('   Please use format: 254XXXXXXXXX');
    } else if (error instanceof ValidationError) {
      console.error('❌ Validation failed:', error.message);
      console.error('   Please check your input data');
    } else if (error instanceof MpesaAuthError) {
      console.error('❌ Authentication failed');
      console.error('   Please check your API credentials');
    } else if (error instanceof MpesaResponseError) {
      console.error('❌ MPesa API error:', error.message);
      console.error('   Response Code:', error.responseCode);
      console.error('   Status Code:', error.statusCode);
    } else if (error instanceof TimeoutError) {
      console.error('❌ Request timed out');
      console.error('   Please try again');
    } else if (error instanceof MaxRetriesExceededError) {
      console.error('❌ Maximum retry attempts exceeded');
      console.error('   The service might be temporarily unavailable');
    } else if (error instanceof MpesaError) {
      console.error('❌ MPesa SDK Error:', error.message);
      console.error('   Details:', error.details);
    } else {
      console.error('❌ Unknown error:', error);
    }
  }
}

async function example3_RetryLogicDemo() {
  console.log('\n=== Example 3: Retry Logic Demonstration ===\n');
  
  console.log('The SDK will automatically retry failed requests:');
  console.log('- Retry attempts: 3');
  console.log('- Initial delay: 1000ms');
  console.log('- Backoff multiplier: 2x (exponential)');
  console.log('- Max delay: 10000ms\n');
  
  console.log('Retry sequence:');
  console.log('  Attempt 1 → Fail → Wait 1000ms');
  console.log('  Attempt 2 → Fail → Wait 2000ms');
  console.log('  Attempt 3 → Fail → Wait 4000ms');
  console.log('  Attempt 4 → Fail → Throw MaxRetriesExceededError\n');
}

async function example4_GracefulErrorHandling() {
  console.log('\n=== Example 4: Graceful Error Handling in Production ===\n');
  
  async function processPayment(amount: number, phone: string, reference: string) {
    try {
      const response = await mpesa.stkPush({
        amount,
        phone,
        accountReference: reference,
        transactionDesc: 'Payment',
      });
      
      return {
        success: true,
        checkoutRequestId: response.CheckoutRequestID,
        message: 'Payment initiated successfully',
      };
    } catch (error) {
      let userMessage = 'An error occurred. Please try again.';
      let shouldRetry = false;
      
      if (error instanceof InvalidPhoneNumberError) {
        userMessage = 'Invalid phone number. Please use a valid Kenyan number.';
        shouldRetry = false;
      } else if (error instanceof ValidationError) {
        userMessage = 'Invalid payment details. Please check and try again.';
        shouldRetry = false;
      } else if (error instanceof MpesaAuthError) {
        userMessage = 'Payment service temporarily unavailable. Please try again later.';
        shouldRetry = true;
      } else if (error instanceof TimeoutError) {
        userMessage = 'Request timed out. Please try again.';
        shouldRetry = true;
      } else if (error instanceof MaxRetriesExceededError) {
        userMessage = 'Service temporarily unavailable. Please try again in a few minutes.';
        shouldRetry = true;
      } else if (error instanceof MpesaResponseError) {
        const mpesaError = error as MpesaResponseError;
        
        if (mpesaError.responseCode === '500.001.1001') {
          userMessage = 'Insufficient funds. Please top up and try again.';
        } else if (mpesaError.statusCode === 401) {
          userMessage = 'Service configuration error. Please contact support.';
        } else {
          userMessage = `Payment failed: ${mpesaError.message}`;
        }
        
        shouldRetry = false;
      }
      
      console.error('Error processing payment:', error);
      
      return {
        success: false,
        message: userMessage,
        shouldRetry,
        error: error instanceof MpesaError ? error.constructor.name : 'UnknownError',
      };
    }
  }
  
  const result = await processPayment(100, '254712345678', 'ORD-123');
  console.log('Payment result:', result);
}

async function example5_LoggingAndMonitoring() {
  console.log('\n=== Example 5: Error Logging for Monitoring ===\n');
  
  function logError(error: any, context: Record<string, any>) {
    const errorLog = {
      timestamp: new Date().toISOString(),
      errorType: error.constructor.name,
      message: error.message,
      context,
    };
    
    if (error instanceof MpesaError) {
      errorLog['statusCode'] = error.statusCode;
      errorLog['details'] = error.details;
    }
    
    if (error instanceof MpesaResponseError) {
      errorLog['responseCode'] = error.responseCode;
    }
    
    console.log('📝 Error Log:', JSON.stringify(errorLog, null, 2));
  }
  
  try {
    await mpesa.stkPush({
      amount: 100,
      phone: 'invalid',
      accountReference: 'TEST',
      transactionDesc: 'Test',
    });
  } catch (error) {
    logError(error, {
      operation: 'stkPush',
      userId: 'user123',
      orderId: 'ORD-456',
    });
  }
}

async function runAllExamples() {
  await example1_BasicErrorHandling();
  await example2_SpecificErrorTypes();
  await example3_RetryLogicDemo();
  await example4_GracefulErrorHandling();
  await example5_LoggingAndMonitoring();
  
  console.log('\n✅ All error handling examples completed!\n');
}

runAllExamples().catch(console.error);
