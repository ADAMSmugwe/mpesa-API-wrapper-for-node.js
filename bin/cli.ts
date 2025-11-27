#!/usr/bin/env node

import { Command } from 'commander';
import Mpesa from '../dist/index.js';
import * as dotenv from 'dotenv';
import { readFileSync } from 'fs';
import { resolve } from 'path';

dotenv.config();

const program = new Command();

// Load package.json for version
const packageJson = JSON.parse(
  readFileSync(resolve(__dirname, '../package.json'), 'utf-8')
);

program
  .name('mpesa-cli')
  .description('Adams MPesa SDK CLI - Test and interact with MPesa API from command line')
  .version(packageJson.version);

// Initialize MPesa instance
function getMpesaInstance() {
  const consumerKey = process.env.MPESA_CONSUMER_KEY;
  const consumerSecret = process.env.MPESA_CONSUMER_SECRET;
  const shortcode = process.env.MPESA_SHORTCODE;
  const passkey = process.env.MPESA_PASSKEY;

  // Validate required config
  if (!consumerKey || !consumerSecret || !shortcode || !passkey) {
    console.error('❌ Error: Missing required environment variables');
    console.error('Please set: MPESA_CONSUMER_KEY, MPESA_CONSUMER_SECRET, MPESA_SHORTCODE, MPESA_PASSKEY');
    console.error('You can create a .env file in your current directory');
    process.exit(1);
  }

  return new Mpesa({
    consumerKey,
    consumerSecret,
    shortcode,
    passkey,
    environment: (process.env.MPESA_ENVIRONMENT || 'sandbox') as 'sandbox' | 'production',
  });
}

// STK Push Command
program
  .command('stk-push')
  .description('Initiate STK Push payment')
  .requiredOption('-p, --phone <number>', 'Phone number (254XXXXXXXXX)')
  .requiredOption('-a, --amount <number>', 'Amount to charge')
  .option('-r, --reference <text>', 'Account reference', 'CLI-Payment')
  .option('-d, --description <text>', 'Transaction description', 'Payment via CLI')
  .option('-c, --callback <url>', 'Callback URL')
  .action(async (options) => {
    try {
      const mpesa = getMpesaInstance();
      
      console.log('🚀 Initiating STK Push...\n');
      
      const response = await mpesa.stkPush({
        amount: parseInt(options.amount),
        phone: options.phone,
        accountReference: options.reference,
        transactionDesc: options.description,
        callbackUrl: options.callback || process.env.MPESA_CALLBACK_URL,
      });

      console.log('✅ STK Push Initiated Successfully!\n');
      console.log('📋 Details:');
      console.log('  Checkout Request ID:', response.CheckoutRequestID);
      console.log('  Merchant Request ID:', response.MerchantRequestID);
      console.log('  Response Code:', response.ResponseCode);
      console.log('  Customer Message:', response.CustomerMessage);
      console.log('\n💡 Tip: Use "mpesa-cli stk-query" to check payment status');
      
    } catch (error: any) {
      console.error('❌ Error:', error.message);
      process.exit(1);
    }
  });

// STK Query Command
program
  .command('stk-query')
  .description('Query STK Push payment status')
  .requiredOption('-i, --id <checkoutRequestId>', 'Checkout Request ID')
  .action(async (options) => {
    try {
      const mpesa = getMpesaInstance();
      
      console.log('🔍 Querying STK Push status...\n');
      
      const response = await mpesa.stkQuery({
        checkoutRequestId: options.id,
      });

      console.log('📊 Payment Status:\n');
      console.log('  Result Code:', response.ResultCode);
      console.log('  Result Description:', response.ResultDesc);
      console.log('  Merchant Request ID:', response.MerchantRequestID);
      console.log('  Checkout Request ID:', response.CheckoutRequestID);

      if (response.ResultCode === '0') {
        console.log('\n✅ Payment was successful!');
      } else {
        console.log('\n❌ Payment failed or was cancelled');
      }
      
    } catch (error: any) {
      console.error('❌ Error:', error.message);
      process.exit(1);
    }
  });

// C2B Register URLs Command
program
  .command('c2b-register')
  .description('Register C2B validation and confirmation URLs')
  .option('-v, --validation <url>', 'Validation URL')
  .option('-c, --confirmation <url>', 'Confirmation URL')
  .option('-t, --response-type <type>', 'Response type (Completed/Cancelled)', 'Completed')
  .action(async (options) => {
    try {
      const mpesa = getMpesaInstance();
      
      console.log('📝 Registering C2B URLs...\n');
      
      const response = await mpesa.c2bRegister({
        validationUrl: options.validation || process.env.MPESA_VALIDATION_URL,
        confirmationUrl: options.confirmation || process.env.MPESA_CONFIRMATION_URL,
        responseType: options.responseType as 'Completed' | 'Cancelled',
      });

      console.log('✅ URLs Registered Successfully!\n');
      console.log('📋 Response:');
      console.log('  Originator Conversation ID:', response.OriginatorCoversationID);
      console.log('  Response Code:', response.ResponseCode);
      console.log('  Response Description:', response.ResponseDescription);
      
    } catch (error: any) {
      console.error('❌ Error:', error.message);
      process.exit(1);
    }
  });

// B2C Payment Command
program
  .command('b2c')
  .description('Send B2C payment (Business to Customer)')
  .requiredOption('-p, --phone <number>', 'Phone number (254XXXXXXXXX)')
  .requiredOption('-a, --amount <number>', 'Amount to send')
  .option('-t, --type <commandId>', 'Command ID (BusinessPayment/SalaryPayment/PromotionPayment)', 'BusinessPayment')
  .option('-o, --occasion <text>', 'Occasion')
  .option('-r, --remarks <text>', 'Remarks', 'B2C Payment via CLI')
  .action(async (options) => {
    try {
      const mpesa = getMpesaInstance();
      
      console.log('💸 Initiating B2C Payment...\n');
      
      const response = await mpesa.b2c({
        amount: parseInt(options.amount),
        phone: options.phone,
        commandId: options.type as 'BusinessPayment' | 'SalaryPayment' | 'PromotionPayment',
        occasion: options.occasion || 'Payment',
        remarks: options.remarks,
        resultUrl: process.env.MPESA_RESULT_URL,
        timeoutUrl: process.env.MPESA_TIMEOUT_URL,
      });

      console.log('✅ B2C Payment Initiated!\n');
      console.log('📋 Details:');
      console.log('  Conversation ID:', response.ConversationID);
      console.log('  Originator Conversation ID:', response.OriginatorConversationID);
      console.log('  Response Code:', response.ResponseCode);
      console.log('  Response Description:', response.ResponseDescription);
      
    } catch (error: any) {
      console.error('❌ Error:', error.message);
      process.exit(1);
    }
  });

// Token Command
program
  .command('token')
  .description('Generate OAuth access token')
  .action(async () => {
    try {
      const mpesa = getMpesaInstance();
      
      console.log('🔑 Generating access token...\n');
      
      const token = await mpesa.getAccessToken();
      const expiry = mpesa.getTokenExpiry();

      console.log('✅ Token Generated Successfully!\n');
      console.log('📋 Token Details:');
      console.log('  Token:', token.substring(0, 20) + '...');
      console.log('  Expires At:', expiry ? new Date(expiry).toLocaleString() : 'Unknown');
      console.log('\n💡 Token is cached and will be reused for subsequent requests');
      
    } catch (error: any) {
      console.error('❌ Error:', error.message);
      process.exit(1);
    }
  });

// Config Command
program
  .command('config')
  .description('Display current configuration')
  .action(() => {
    console.log('⚙️  Current Configuration:\n');
    console.log('  Environment:', process.env.MPESA_ENVIRONMENT || 'sandbox');
    console.log('  Consumer Key:', process.env.MPESA_CONSUMER_KEY ? '✓ Set' : '✗ Not set');
    console.log('  Consumer Secret:', process.env.MPESA_CONSUMER_SECRET ? '✓ Set' : '✗ Not set');
    console.log('  Shortcode:', process.env.MPESA_SHORTCODE || '✗ Not set');
    console.log('  Passkey:', process.env.MPESA_PASSKEY ? '✓ Set' : '✗ Not set');
    console.log('\n📝 Callback URLs:');
    console.log('  Callback URL:', process.env.MPESA_CALLBACK_URL || '✗ Not set');
    console.log('  Result URL:', process.env.MPESA_RESULT_URL || '✗ Not set');
    console.log('  Timeout URL:', process.env.MPESA_TIMEOUT_URL || '✗ Not set');
    console.log('  Validation URL:', process.env.MPESA_VALIDATION_URL || '✗ Not set');
    console.log('  Confirmation URL:', process.env.MPESA_CONFIRMATION_URL || '✗ Not set');
  });

program.parse();
