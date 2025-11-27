import express from 'express';
import Mpesa from '../src/index';
import 'dotenv/config';

const app = express();
app.use(express.json());

const mpesa = new Mpesa({
  consumerKey: process.env.MPESA_CONSUMER_KEY!,
  consumerSecret: process.env.MPESA_CONSUMER_SECRET!,
  shortcode: process.env.MPESA_SHORTCODE!,
  passkey: process.env.MPESA_PASSKEY!,
  environment: (process.env.MPESA_ENVIRONMENT as 'sandbox' | 'production') || 'sandbox',
});

app.post('/api/payment/initiate', async (req, res) => {
  try {
    const { amount, phone, accountReference, description } = req.body;

    if (!amount || !phone || !accountReference) {
      return res.status(400).json({
        success: false,
        message: 'Missing required fields: amount, phone, accountReference',
      });
    }

    const response = await mpesa.stkPush({
      amount: Number(amount),
      phone,
      accountReference,
      transactionDesc: description || 'Payment',
      callbackUrl: process.env.CALLBACK_URL || 'https://yourdomain.com/api/payment/callback',
    });

    res.json({
      success: true,
      message: 'Payment initiated. Check your phone for MPesa prompt.',
      data: {
        checkoutRequestId: response.CheckoutRequestID,
        merchantRequestId: response.MerchantRequestID,
        responseCode: response.ResponseCode,
        responseDescription: response.ResponseDescription,
        customerMessage: response.CustomerMessage,
      },
    });
  } catch (error: any) {
    console.error('Payment initiation error:', error);
    
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to initiate payment',
      error: error.name,
    });
  }
});

app.get('/api/payment/:checkoutRequestId/status', async (req, res) => {
  try {
    const { checkoutRequestId } = req.params;

    const response = await mpesa.stkQuery({
      checkoutRequestId,
    });

    res.json({
      success: true,
      data: {
        resultCode: response.ResultCode,
        resultDescription: response.ResultDesc,
        merchantRequestId: response.MerchantRequestID,
        checkoutRequestId: response.CheckoutRequestID,
      },
    });
  } catch (error: any) {
    console.error('Payment query error:', error);
    
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to query payment status',
    });
  }
});

const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
  console.log(`✅ Express server running on port ${PORT}`);
  console.log(`📱 STK Push endpoint: POST http://localhost:${PORT}/api/payment/initiate`);
  console.log(`📊 Query status endpoint: GET http://localhost:${PORT}/api/payment/:checkoutRequestId/status`);
});
