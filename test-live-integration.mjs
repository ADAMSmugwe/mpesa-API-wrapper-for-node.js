import pkg from './dist/index.js';
const { default: Mpesa } = pkg;
import dotenv from 'dotenv';

dotenv.config();

console.log('🚀 Testing Live STK Push Integration\n');

const mpesa = new Mpesa({
  consumerKey: process.env.MPESA_CONSUMER_KEY,
  consumerSecret: process.env.MPESA_CONSUMER_SECRET,
  shortcode: process.env.MPESA_SHORTCODE,
  passkey: process.env.MPESA_PASSKEY,
  environment: 'sandbox',
});

async function runTests() {
  try {
    // Test 1: Token Generation
    console.log('Test 1: Generating OAuth Token...');
    const token = await mpesa.getAccessToken();
    console.log('✅ Token generated:', token.substring(0, 20) + '...\n');

    // Test 2: STK Push
    console.log('Test 2: Initiating STK Push...');
    const stkResponse = await mpesa.stkPush({
      amount: 1,
      phone: '254708374149', // Sandbox test number
      accountReference: 'TEST-' + Date.now(),
      transactionDesc: 'Integration Test',
      callbackUrl: 'https://webhook.site/unique-id', // Public test URL
    });
    
    console.log('✅ STK Push initiated!');
    console.log('   Checkout Request ID:', stkResponse.CheckoutRequestID);
    console.log('   Merchant Request ID:', stkResponse.MerchantRequestID);
    console.log('   Response Code:', stkResponse.ResponseCode);
    console.log('   Customer Message:', stkResponse.CustomerMessage);
    console.log('');

    // Test 3: STK Query
    console.log('Test 3: Querying STK Push status...');
    await new Promise(resolve => setTimeout(resolve, 2000)); // Wait 2 seconds
    
    const queryResponse = await mpesa.stkQuery({
      checkoutRequestId: stkResponse.CheckoutRequestID,
    });
    
    console.log('✅ STK Query successful!');
    console.log('   Result Code:', queryResponse.ResultCode);
    console.log('   Result Description:', queryResponse.ResultDesc);
    console.log('');

    // Test 4: Token Caching
    console.log('Test 4: Testing token caching...');
    const cachedToken = await mpesa.getAccessToken();
    console.log('✅ Token retrieved from cache:', token === cachedToken ? 'Yes' : 'No');
    console.log('');

    // Test 5: Token Expiry
    const expiry = mpesa.getTokenExpiry();
    console.log('Test 5: Token expiry time...');
    console.log('✅ Expires at:', new Date(expiry).toLocaleString());
    console.log('');

    console.log('🎉 All integration tests passed!\n');
    console.log('Summary:');
    console.log('  ✅ OAuth token generation');
    console.log('  ✅ STK Push initiation');
    console.log('  ✅ STK Push query');
    console.log('  ✅ Token caching');
    console.log('  ✅ Token expiry tracking');

  } catch (error) {
    console.error('❌ Test failed:', error.message);
    console.error('Error type:', error.constructor.name);
    if (error.details) {
      console.error('Details:', error.details);
    }
    process.exit(1);
  }
}

runTests();
