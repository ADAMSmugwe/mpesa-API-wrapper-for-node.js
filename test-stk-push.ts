import 'dotenv/config';
import Mpesa from './src/index';

async function testSTKPush() {
  console.log('═══════════════════════════════════════════');
  console.log('   MPesa STK Push Test');
  console.log('═══════════════════════════════════════════\n');

  const mpesa = new Mpesa({
    consumerKey: process.env.MPESA_CONSUMER_KEY!,
    consumerSecret: process.env.MPESA_CONSUMER_SECRET!,
    shortcode: process.env.MPESA_SHORTCODE!,
    passkey: process.env.MPESA_PASSKEY!,
    environment: 'sandbox',
  });

  try {
    console.log('📱 Initiating STK Push to +254799444900...\n');
    
    const response = await mpesa.stkPush({
      amount: 10,
      phone: '254799444900',
      accountReference: 'ORDER123',
      transactionDesc: 'Payment for Order #123',
      callbackUrl: 'https://example.com/callback',
    });
    
    console.log('✅ STK Push Initiated Successfully!\n');
    console.log('📋 Transaction Details:');
    console.log('   Checkout Request ID:', response.CheckoutRequestID);
    console.log('   Merchant Request ID:', response.MerchantRequestID);
    console.log('   Response Code:', response.ResponseCode);
    console.log('   Response:', response.ResponseDescription);
    console.log('   Customer Message:', response.CustomerMessage);
    
    console.log('\n📱 Check your phone (+254799444900) for the M-Pesa prompt!');
    console.log('\n💡 To query this payment later, use:');
    console.log(`   CheckoutRequestID: ${response.CheckoutRequestID}\n`);

    console.log('\n🎉 Your MPesa SDK is working perfectly!\n');

  } catch (error: any) {
    console.error('❌ Error:', error.message);
    if (error.statusCode) {
      console.error('   Status Code:', error.statusCode);
    }
    if (error.responseCode) {
      console.error('   Response Code:', error.responseCode);
    }
    console.error('\n');
  }
}

testSTKPush();
