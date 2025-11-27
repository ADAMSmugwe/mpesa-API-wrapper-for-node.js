import express from 'express';
import { mpesaCallbackMiddleware, c2bCallbackMiddleware, MpesaRequest } from '../src/index';
import 'dotenv/config';

const app = express();
app.use(express.json());

app.post(
  '/api/mpesa/stk-callback',
  mpesaCallbackMiddleware({
    verifySignature: false,
  }),
  (req: MpesaRequest, res) => {
    const mpesaData = req.mpesa;

    if (!mpesaData) {
      return res.json({ ResultCode: 1, ResultDesc: 'No callback data' });
    }

    if (mpesaData.ResultCode === 0) {
      console.log('✅ Payment Successful!');
      console.log('CheckoutRequestID:', mpesaData.CheckoutRequestID);
      console.log('MerchantRequestID:', mpesaData.MerchantRequestID);

      if (mpesaData.metadata) {
        console.log('Amount:', mpesaData.metadata.Amount);
        console.log('Receipt Number:', mpesaData.metadata.MpesaReceiptNumber);
        console.log('Phone Number:', mpesaData.metadata.PhoneNumber);
        console.log('Transaction Date:', mpesaData.metadata.TransactionDate);
      }

    } else {
      console.log('❌ Payment Failed');
      console.log('Result Code:', mpesaData.ResultCode);
      console.log('Result Description:', mpesaData.ResultDesc);
    }

    res.json({ ResultCode: 0, ResultDesc: 'Success' });
  }
);

app.post(
  '/api/mpesa/stk-callback-secure',
  mpesaCallbackMiddleware({
    verifySignature: true,
    secretKey: process.env.MPESA_SECRET_KEY || 'your-secret-key',
    signatureHeader: 'x-mpesa-signature',
  }),
  (req: MpesaRequest, res) => {
    const mpesaData = req.mpesa;

    console.log('🔐 Secure callback received with valid signature');
    console.log('Callback Data:', mpesaData);

    res.json({ ResultCode: 0, ResultDesc: 'Success' });
  }
);

app.post(
  '/api/mpesa/c2b-validation',
  c2bCallbackMiddleware(),
  (req: MpesaRequest, res) => {
    const { metadata } = req.mpesa!;

    console.log('📥 C2B Validation Request');
    console.log('Amount:', metadata?.TransAmount);
    console.log('Bill Ref Number:', metadata?.BillRefNumber);
    console.log('Phone Number:', metadata?.MSISDN);

    const isValid = true;

    if (isValid) {
      res.json({ ResultCode: 0, ResultDesc: 'Accepted' });
    } else {
      res.json({ ResultCode: 'C2B00011', ResultDesc: 'Invalid Account Number' });
    }
  }
);

app.post(
  '/api/mpesa/c2b-confirmation',
  c2bCallbackMiddleware(),
  (req: MpesaRequest, res) => {
    const { metadata } = req.mpesa!;

    console.log('✅ C2B Payment Confirmed!');
    console.log('Transaction ID:', metadata?.TransID);
    console.log('Amount:', metadata?.TransAmount);
    console.log('Phone Number:', metadata?.MSISDN);
    console.log('Bill Ref Number:', metadata?.BillRefNumber);

    res.json({ ResultCode: 0, ResultDesc: 'Success' });
  }
);

const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
  console.log(`✅ Callback server running on port ${PORT}`);
  console.log(`📞 STK Callback: POST http://localhost:${PORT}/api/mpesa/stk-callback`);
  console.log(`🔐 Secure STK Callback: POST http://localhost:${PORT}/api/mpesa/stk-callback-secure`);
  console.log(`✔️  C2B Validation: POST http://localhost:${PORT}/api/mpesa/c2b-validation`);
  console.log(`✅ C2B Confirmation: POST http://localhost:${PORT}/api/mpesa/c2b-confirmation`);
});
