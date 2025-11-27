/**
 * MPesa Integration with Next.js 14+ (App Router)
 * 
 * Installation:
 * npm install adams-mpesa-sdk
 * 
 * File structure:
 * app/
 *   api/
 *     mpesa/
 *       stk-push/
 *         route.ts (this file - initiate payment)
 *       stk-query/
 *         [id]/route.ts (query payment status)
 *       callback/
 *         route.ts (handle MPesa callback)
 */

import { NextRequest, NextResponse } from 'next/server';
import Mpesa from 'adams-mpesa-sdk';

// Initialize MPesa SDK
function getMpesaInstance() {
  return new Mpesa({
    consumerKey: process.env.MPESA_CONSUMER_KEY!,
    consumerSecret: process.env.MPESA_CONSUMER_SECRET!,
    shortcode: process.env.MPESA_SHORTCODE!,
    passkey: process.env.MPESA_PASSKEY!,
    environment: (process.env.MPESA_ENVIRONMENT as 'sandbox' | 'production') || 'sandbox',
  });
}

/**
 * API Route: /api/mpesa/stk-push
 * Method: POST
 * Initiates STK Push payment
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { amount, phone, accountReference, description } = body;

    // Validate input
    if (!amount || !phone || !accountReference) {
      return NextResponse.json(
        {
          success: false,
          message: 'Missing required fields: amount, phone, accountReference',
        },
        { status: 400 }
      );
    }

    const mpesa = getMpesaInstance();

    const response = await mpesa.stkPush({
      amount: parseInt(amount),
      phone,
      accountReference,
      transactionDesc: description || 'Payment',
      callbackUrl: `${process.env.NEXT_PUBLIC_APP_URL}/api/mpesa/callback`,
    });

    return NextResponse.json({
      success: true,
      message: 'STK Push initiated successfully',
      data: {
        checkoutRequestId: response.CheckoutRequestID,
        merchantRequestId: response.MerchantRequestID,
        responseCode: response.ResponseCode,
        customerMessage: response.CustomerMessage,
      },
    });
  } catch (error: any) {
    console.error('STK Push error:', error);
    return NextResponse.json(
      {
        success: false,
        message: error.message || 'Failed to initiate payment',
      },
      { status: 500 }
    );
  }
}

/**
 * API Route: /api/mpesa/stk-query/[id]
 * Method: GET
 * Queries payment status
 */
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const checkoutRequestId = params.id;

    const mpesa = getMpesaInstance();

    const response = await mpesa.stkQuery({
      checkoutRequestId,
    });

    return NextResponse.json({
      success: true,
      data: {
        resultCode: response.ResultCode,
        resultDescription: response.ResultDesc,
        merchantRequestId: response.MerchantRequestID,
        checkoutRequestId: response.CheckoutRequestID,
      },
    });
  } catch (error: any) {
    console.error('STK Query error:', error);
    return NextResponse.json(
      {
        success: false,
        message: error.message || 'Failed to query payment status',
      },
      { status: 500 }
    );
  }
}

/**
 * API Route: /api/mpesa/callback
 * Method: POST
 * Handles MPesa callback
 */
export async function handleCallback(request: NextRequest) {
  try {
    const body = await request.json();
    const { Body: callbackBody } = body;

    if (!callbackBody) {
      return NextResponse.json(
        { ResultCode: 1, ResultDesc: 'Invalid callback structure' },
        { status: 400 }
      );
    }

    const { stkCallback } = callbackBody;

    if (stkCallback.ResultCode === 0) {
      // Payment successful
      const metadata = stkCallback.CallbackMetadata?.Item || [];
      const amount = metadata.find((item: any) => item.Name === 'Amount')?.Value;
      const mpesaReceiptNumber = metadata.find(
        (item: any) => item.Name === 'MpesaReceiptNumber'
      )?.Value;
      const phoneNumber = metadata.find((item: any) => item.Name === 'PhoneNumber')?.Value;

      console.log('✅ Payment successful:', {
        amount,
        receipt: mpesaReceiptNumber,
        phone: phoneNumber,
        checkoutRequestId: stkCallback.CheckoutRequestID,
      });

      // TODO: Update your database
      // await db.payments.update({
      //   checkoutRequestId: stkCallback.CheckoutRequestID,
      //   status: 'completed',
      //   mpesaReceiptNumber,
      //   amount,
      // });
    } else {
      // Payment failed
      console.log('❌ Payment failed:', stkCallback.ResultDesc);

      // TODO: Update your database
      // await db.payments.update({
      //   checkoutRequestId: stkCallback.CheckoutRequestID,
      //   status: 'failed',
      //   failureReason: stkCallback.ResultDesc,
      // });
    }

    // Respond to MPesa
    return NextResponse.json({
      ResultCode: 0,
      ResultDesc: 'Success',
    });
  } catch (error: any) {
    console.error('Callback error:', error);
    return NextResponse.json(
      { ResultCode: 1, ResultDesc: 'Internal server error' },
      { status: 500 }
    );
  }
}

/**
 * Example React Component (Client)
 * File: app/checkout/page.tsx
 */

/*
'use client';

import { useState } from 'react';

export default function CheckoutPage() {
  const [loading, setLoading] = useState(false);
  const [checkoutRequestId, setCheckoutRequestId] = useState('');

  const handlePayment = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);

    const formData = new FormData(e.currentTarget);
    const data = {
      amount: formData.get('amount'),
      phone: formData.get('phone'),
      accountReference: formData.get('reference'),
      description: formData.get('description'),
    };

    try {
      const response = await fetch('/api/mpesa/stk-push', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });

      const result = await response.json();

      if (result.success) {
        setCheckoutRequestId(result.data.checkoutRequestId);
        alert('Payment initiated! Check your phone for MPesa prompt.');
      } else {
        alert('Payment failed: ' + result.message);
      }
    } catch (error) {
      console.error('Payment error:', error);
      alert('An error occurred');
    } finally {
      setLoading(false);
    }
  };

  const checkStatus = async () => {
    if (!checkoutRequestId) return;

    const response = await fetch(`/api/mpesa/stk-query/${checkoutRequestId}`);
    const result = await response.json();

    if (result.success) {
      alert(`Payment status: ${result.data.resultDescription}`);
    }
  };

  return (
    <div className="max-w-md mx-auto p-6">
      <h1 className="text-2xl font-bold mb-4">MPesa Payment</h1>
      
      <form onSubmit={handlePayment} className="space-y-4">
        <div>
          <label className="block mb-2">Amount (KES)</label>
          <input
            type="number"
            name="amount"
            required
            className="w-full border p-2 rounded"
            placeholder="100"
          />
        </div>

        <div>
          <label className="block mb-2">Phone Number</label>
          <input
            type="tel"
            name="phone"
            required
            className="w-full border p-2 rounded"
            placeholder="254712345678"
          />
        </div>

        <div>
          <label className="block mb-2">Account Reference</label>
          <input
            type="text"
            name="reference"
            required
            className="w-full border p-2 rounded"
            placeholder="ORDER-123"
          />
        </div>

        <div>
          <label className="block mb-2">Description (Optional)</label>
          <input
            type="text"
            name="description"
            className="w-full border p-2 rounded"
            placeholder="Payment for order"
          />
        </div>

        <button
          type="submit"
          disabled={loading}
          className="w-full bg-green-600 text-white p-3 rounded font-bold disabled:bg-gray-400"
        >
          {loading ? 'Processing...' : 'Pay with MPesa'}
        </button>
      </form>

      {checkoutRequestId && (
        <div className="mt-6">
          <button
            onClick={checkStatus}
            className="w-full bg-blue-600 text-white p-3 rounded"
          >
            Check Payment Status
          </button>
        </div>
      )}
    </div>
  );
}
*/

/**
 * Example .env.local file:
 * 
 * MPESA_CONSUMER_KEY=your_consumer_key
 * MPESA_CONSUMER_SECRET=your_consumer_secret
 * MPESA_SHORTCODE=174379
 * MPESA_PASSKEY=your_passkey
 * MPESA_ENVIRONMENT=sandbox
 * NEXT_PUBLIC_APP_URL=https://yourdomain.com
 */
