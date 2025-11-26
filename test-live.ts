import 'dotenv/config';
import Mpesa from './src/index';

async function testMpesaSDK() {
  console.log('🚀 Testing MPesa SDK...\n');

  const mpesa = new Mpesa({
    consumerKey: process.env.MPESA_CONSUMER_KEY!,
    consumerSecret: process.env.MPESA_CONSUMER_SECRET!,
    shortcode: process.env.MPESA_SHORTCODE!,
    passkey: process.env.MPESA_PASSKEY!,
    environment: (process.env.MPESA_ENVIRONMENT as 'sandbox' | 'production') || 'sandbox',
    initiatorName: process.env.MPESA_INITIATOR_NAME,
    securityCredential: process.env.MPESA_SECURITY_CREDENTIAL,
  });

  try {
    console.log('1️⃣  Testing OAuth Token Generation...');
    const token = await mpesa.getAccessToken();
    console.log('✅ Token generated successfully!');
    console.log(`   Token: ${token.substring(0, 20)}...`);
    console.log(`   Expiry: ${new Date(mpesa.getTokenExpiry()!).toLocaleString()}\n`);

    console.log('2️⃣  Testing STK Push (Lipa Na M-Pesa)...');
    console.log('   NOTE: You need to replace the phone number below with a valid test number\n');
    
    const stkResponse = await mpesa.stkPush({
      amount: 1,
      phone: '254799444900',
      accountReference: 'TestPayment',
      transactionDesc: 'Testing MPesa SDK',
      callbackUrl: process.env.MPESA_CALLBACK_URL || 'https://example.com/callback',
    });
    
    console.log('✅ STK Push initiated successfully!');
    console.log(`   Checkout Request ID: ${stkResponse.CheckoutRequestID}`);
    console.log(`   Merchant Request ID: ${stkResponse.MerchantRequestID}`);
    console.log(`   Response: ${stkResponse.ResponseDescription}\n`);

    console.log('3️⃣  Querying STK Push status...');
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    const queryResponse = await mpesa.stkQuery({
      checkoutRequestId: stkResponse.CheckoutRequestID,
    });
    
    console.log('✅ STK Query completed!');
    console.log(`   Result Code: ${queryResponse.ResultCode}`);
    console.log(`   Result Description: ${queryResponse.ResultDesc}\n`);

    console.log('✅ All tests completed successfully! 🎉\n');

  } catch (error: any) {
    console.error('❌ Error occurred:', error.message);
    if (error.statusCode) {
      console.error('   Status Code:', error.statusCode);
    }
    if (error.responseCode) {
      console.error('   Response Code:', error.responseCode);
    }
    if (error.response) {
      console.error('   Response Data:', JSON.stringify(error.response, null, 2));
    }
    if (error.cause) {
      console.error('   Cause:', error.cause);
    }
    console.error('\n   Full Error:', error);
  }
}

console.log('═══════════════════════════════════════════');
console.log('   MPesa API SDK Test Suite');
console.log('═══════════════════════════════════════════\n');

if (!process.env.MPESA_CONSUMER_KEY || process.env.MPESA_CONSUMER_KEY === 'your_consumer_key_here') {
  console.log('⚠️  WARNING: Please configure your .env file with valid MPesa credentials!');
  console.log('   Edit the .env file and add your:');
  console.log('   - MPESA_CONSUMER_KEY');
  console.log('   - MPESA_CONSUMER_SECRET');
  console.log('   - MPESA_SHORTCODE');
  console.log('   - MPESA_PASSKEY\n');
  console.log('   You can get these from: https://developer.safaricom.co.ke/\n');
} else {
  testMpesaSDK();
}
