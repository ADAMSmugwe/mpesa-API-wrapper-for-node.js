import { Request, Response, NextFunction } from 'express';
import * as crypto from 'crypto';

export interface MpesaCallbackData {
  MerchantRequestID?: string;
  CheckoutRequestID?: string;
  ResultCode: number;
  ResultDesc: string;
  CallbackMetadata?: {
    Item: Array<{ Name: string; Value: string | number }>;
  };
  metadata?: Record<string, string | number>;
}

export interface MpesaRequest extends Request {
  mpesa?: MpesaCallbackData;
}

export interface MpesaMiddlewareOptions {
  verifySignature?: boolean;
  secretKey?: string;
  signatureHeader?: string;
}

export function verifyCallbackSignature(
  payload: string,
  signature: string,
  secretKey: string,
): boolean {
  const computedSignature = crypto
    .createHmac('sha256', secretKey)
    .update(payload)
    .digest('base64');
  
  return crypto.timingSafeEqual(
    Buffer.from(signature),
    Buffer.from(computedSignature)
  );
}

export function mpesaCallbackMiddleware(options: MpesaMiddlewareOptions = {}) {
  const {
    verifySignature = false,
    secretKey = '',
    signatureHeader = 'x-mpesa-signature',
  } = options;

  return (req: MpesaRequest, res: Response, next: NextFunction): void => {
    try {
      if (verifySignature) {
        if (!secretKey) {
          res.status(500).json({
            ResultCode: 1,
            ResultDesc: 'Server configuration error: Secret key not provided',
          });
          return;
        }

        const signature = req.headers[signatureHeader.toLowerCase()] as string;
        
        if (!signature) {
          res.status(401).json({
            ResultCode: 1,
            ResultDesc: 'Missing signature header',
          });
          return;
        }

        const payload = JSON.stringify(req.body);
        const isValid = verifyCallbackSignature(payload, signature, secretKey);

        if (!isValid) {
          res.status(401).json({
            ResultCode: 1,
            ResultDesc: 'Invalid signature',
          });
          return;
        }
      }

      const { Body } = req.body;

      if (!Body) {
        res.status(400).json({
          ResultCode: 1,
          ResultDesc: 'Invalid callback structure: Missing Body',
        });
        return;
      }

      const { stkCallback } = Body;

      if (!stkCallback) {
        req.mpesa = {
          ResultCode: -1,
          ResultDesc: 'Invalid callback: Missing stkCallback',
        };
        next();
        return;
      }

      const callbackData: MpesaCallbackData = {
        MerchantRequestID: stkCallback.MerchantRequestID,
        CheckoutRequestID: stkCallback.CheckoutRequestID,
        ResultCode: stkCallback.ResultCode,
        ResultDesc: stkCallback.ResultDesc,
        CallbackMetadata: stkCallback.CallbackMetadata,
      };

      if (stkCallback.CallbackMetadata && stkCallback.CallbackMetadata.Item) {
        const metadata: Record<string, string | number> = {};
        
        for (const item of stkCallback.CallbackMetadata.Item) {
          metadata[item.Name] = item.Value;
        }
        
        callbackData.metadata = metadata;
      }

      req.mpesa = callbackData;
      next();
    } catch (error: any) {
      res.status(500).json({
        ResultCode: 1,
        ResultDesc: `Error processing callback: ${error.message}`,
      });
    }
  };
}

export function c2bCallbackMiddleware(options: MpesaMiddlewareOptions = {}) {
  const {
    verifySignature = false,
    secretKey = '',
    signatureHeader = 'x-mpesa-signature',
  } = options;

  return (req: MpesaRequest, res: Response, next: NextFunction): void => {
    try {
      if (verifySignature) {
        if (!secretKey) {
          res.status(500).json({
            ResultCode: 'C2B00012',
            ResultDesc: 'Server configuration error',
          });
          return;
        }

        const signature = req.headers[signatureHeader.toLowerCase()] as string;
        
        if (!signature) {
          res.status(401).json({
            ResultCode: 'C2B00013',
            ResultDesc: 'Missing signature',
          });
          return;
        }

        const payload = JSON.stringify(req.body);
        const isValid = verifyCallbackSignature(payload, signature, secretKey);

        if (!isValid) {
          res.status(401).json({
            ResultCode: 'C2B00014',
            ResultDesc: 'Invalid signature',
          });
          return;
        }
      }

      const { TransactionType, TransID, TransAmount, BusinessShortCode, BillRefNumber, MSISDN } = req.body;

      req.mpesa = {
        ResultCode: 0,
        ResultDesc: 'Success',
        metadata: {
          TransactionType,
          TransID,
          TransAmount,
          BusinessShortCode,
          BillRefNumber,
          MSISDN,
        },
      };

      next();
    } catch (error: any) {
      res.status(500).json({
        ResultCode: 'C2B00015',
        ResultDesc: `Error: ${error.message}`,
      });
    }
  };
}
