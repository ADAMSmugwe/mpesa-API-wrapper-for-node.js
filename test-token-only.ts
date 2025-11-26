import 'dotenv/config';
import Mpesa from './src/index';

async function testToken() {
  console.log('Testing OAuth Token Only...\n');

  const mpesa = new Mpesa({
    consumerKey: process.env.MPESA_CONSUMER_KEY!,
    consumerSecret: process.env.MPESA_CONSUMER_SECRET!,
    shortcode: process.env.MPESA_SHORTCODE!,
    passkey: process.env.MPESA_PASSKEY!,
    environment: 'sandbox',
  });

  try {
    console.log('Generating OAuth token...');
    const token = await mpesa.getAccessToken();
    console.log('\n✅ SUCCESS!');
    console.log('Token:', token);
    console.log('Token Length:', token.length);
    console.log('Expiry:', new Date(mpesa.getTokenExpiry()!).toLocaleString());
    
    console.log('\n📝 Your credentials are valid!');
    console.log('\n⚠️  Next steps:');
    console.log('1. Go to https://developer.safaricom.co.ke/MyApps');
    console.log('2. Select your app');
    console.log('3. Click "Add Product" or "Subscribe"');
    console.log('4. Subscribe to: "Lipa Na M-Pesa Online"');
    console.log('5. Then try the full test again\n');
    
  } catch (error: any) {
    console.error('\n❌ Error:', error.message);
    console.error('\nYour Consumer Key/Secret might be incorrect.');
    console.error('Please verify them at https://developer.safaricom.co.ke/\n');
  }
}

testToken();
