/**
 * Example usage of Adams MPesa SDK
 * This file demonstrates how to use the SDK in a real application
 */

import { Mpesa } from './src/index';
import * as dotenv from 'dotenv';

// Load environment variables
dotenv.config();

// Initialize MPesa SDK
const mpesa = new Mpesa({
  consumerKey: process.env.MPESA_CONSUMER_KEY || '',
  consumerSecret: process.env.MPESA_CONSUMER_SECRET || '',
  shortcode: process.env.MPESA_SHORTCODE || '',
  passkey: process.env.MPESA_PASSKEY || '',
  environment: (process.env.MPESA_ENVIRONMENT as 'sandbox' | 'production') || 'sandbox',
  // Optional: For B2C transactions
  initiatorName: process.env.MPESA_INITIATOR_NAME,
  securityCredential: process.env.MPESA_SECURITY_CREDENTIAL,
});

/**
 * Example 1: STK Push (Lipa Na MPesa Online)
 */
async function exampleStkPush() {
  try {
    console.log('🚀 Initiating STK Push...');
    
    const response = await mpesa.stkPush({
      amount: 1,
      phone: '254712345678', // Replace with actual phone number
      accountReference: 'ORDER-12345',
      transactionDesc: 'Payment for order #12345',
      callbackUrl: 'https://yourdomain.com/api/mpesa/callback',
    });

    console.log('✅ STK Push initiated successfully:');
    console.log(response);
    
    // Query the status after a few seconds
    setTimeout(async () => {
      try {
        const status = await mpesa.stkQuery({
          checkoutRequestId: response.CheckoutRequestID,
        });
        console.log('📊 Transaction Status:');
        console.log(status);
      } catch (error) {
        console.error('❌ Error querying status:', error);
      }
    }, 5000);
    
  } catch (error: any) {
    console.error('❌ STK Push failed:', error.message);
  }
}

/**
 * Example 2: C2B URL Registration
 */
async function exampleC2BRegister() {
  try {
    console.log('🚀 Registering C2B URLs...');
    
    const response = await mpesa.c2bRegister({
      validationUrl: 'https://yourdomain.com/api/mpesa/validate',
      confirmationUrl: 'https://yourdomain.com/api/mpesa/confirm',
      responseType: 'Completed',
    });

    console.log('✅ C2B URLs registered successfully:');
    console.log(response);
    
  } catch (error: any) {
    console.error('❌ C2B registration failed:', error.message);
  }
}

/**
 * Example 3: C2B Payment Simulation (Sandbox only)
 */
async function exampleC2BSimulate() {
  try {
    console.log('🚀 Simulating C2B payment...');
    
    const response = await mpesa.c2bSimulate({
      amount: 100,
      phone: '254712345678',
      billRefNumber: 'INVOICE-001',
      commandId: 'CustomerPayBillOnline',
    });

    console.log('✅ C2B payment simulated successfully:');
    console.log(response);
    
  } catch (error: any) {
    console.error('❌ C2B simulation failed:', error.message);
  }
}

/**
 * Example 4: B2C Payment (Business to Customer)
 */
async function exampleB2C() {
  try {
    console.log('🚀 Sending B2C payment...');
    
    const response = await mpesa.b2c({
      amount: 100,
      phone: '254712345678',
      commandId: 'BusinessPayment',
      remarks: 'Salary payment for January',
      occasion: 'Salary',
      resultUrl: 'https://yourdomain.com/api/mpesa/b2c/result',
      timeoutUrl: 'https://yourdomain.com/api/mpesa/b2c/timeout',
    });

    console.log('✅ B2C payment initiated successfully:');
    console.log(response);
    
  } catch (error: any) {
    console.error('❌ B2C payment failed:', error.message);
  }
}

/**
 * Example 5: Transaction Status Query
 */
async function exampleTransactionStatus() {
  try {
    console.log('🚀 Querying transaction status...');
    
    const response = await mpesa.transactionStatus({
      transactionId: 'OEI2AK4Q16', // Replace with actual transaction ID
      remarks: 'Query transaction status',
      resultUrl: 'https://yourdomain.com/api/mpesa/status/result',
      timeoutUrl: 'https://yourdomain.com/api/mpesa/status/timeout',
    });

    console.log('✅ Transaction status query initiated:');
    console.log(response);
    
  } catch (error: any) {
    console.error('❌ Status query failed:', error.message);
  }
}

/**
 * Example 6: Token Management
 */
async function exampleTokenManagement() {
  try {
    console.log('🚀 Managing access tokens...');
    
    // Get current token
    const token = await mpesa.getAccessToken();
    console.log('🔑 Current token:', token.substring(0, 20) + '...');
    
    // Get token expiry
    const expiry = mpesa.getTokenExpiry();
    if (expiry) {
      const expiryDate = new Date(expiry);
      console.log('⏰ Token expires at:', expiryDate.toLocaleString());
    }
    
    // Force refresh token
    const newToken = await mpesa.refreshAccessToken();
    console.log('🔄 New token:', newToken.substring(0, 20) + '...');
    
    // Clear token cache
    mpesa.clearTokenCache();
    console.log('🗑️  Token cache cleared');
    
  } catch (error: any) {
    console.error('❌ Token management failed:', error.message);
  }
}

/**
 * Main function to run examples
 */
async function main() {
  console.log('='.repeat(60));
  console.log('📱 Adams MPesa SDK - Usage Examples');
  console.log('='.repeat(60));
  console.log('');

  // Uncomment the example you want to run:
  
  // await exampleStkPush();
  // await exampleC2BRegister();
  // await exampleC2BSimulate();
  // await exampleB2C();
  // await exampleTransactionStatus();
  await exampleTokenManagement();
  
  console.log('');
  console.log('='.repeat(60));
  console.log('✨ Done!');
  console.log('='.repeat(60));
}

// Run examples
if (require.main === module) {
  main().catch(console.error);
}

export {
  exampleStkPush,
  exampleC2BRegister,
  exampleC2BSimulate,
  exampleB2C,
  exampleTransactionStatus,
  exampleTokenManagement,
};
