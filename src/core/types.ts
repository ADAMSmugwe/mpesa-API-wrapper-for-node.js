export type MpesaEnvironment = 'sandbox' | 'production';

export interface MpesaConfig {
  consumerKey: string;
  consumerSecret: string;
  shortcode: string;
  passkey: string;
  environment: MpesaEnvironment;
  initiatorName?: string;
  securityCredential?: string;
  autoRefreshToken?: boolean;
  maxRetries?: number;
  timeout?: number;
}

export interface TokenResponse {
  access_token: string;
  expires_in: string;
}

export interface CachedToken {
  token: string;
  expiresAt: number;
}

export interface StkPushRequest {
  amount: number;
  phone: string;
  accountReference: string;
  transactionDesc?: string;
  callbackUrl?: string;
}

export interface StkPushResponse {
  MerchantRequestID: string;
  CheckoutRequestID: string;
  ResponseCode: string;
  ResponseDescription: string;
  CustomerMessage: string;
}

export interface StkQueryRequest {
  checkoutRequestId: string;
}

export interface StkQueryResponse {
  ResponseCode: string;
  ResponseDescription: string;
  MerchantRequestID: string;
  CheckoutRequestID: string;
  ResultCode: string;
  ResultDesc: string;
}

export interface C2BRegisterRequest {
  validationUrl: string;
  confirmationUrl: string;
  responseType?: 'Completed' | 'Cancelled';
  shortcode?: string;
}

export interface C2BRegisterResponse {
  OriginatorCoversationID: string;
  ResponseCode: string;
  ResponseDescription: string;
}

export interface C2BSimulateRequest {
  amount: number;
  phone: string;
  billRefNumber?: string;
  commandId?: 'CustomerPayBillOnline' | 'CustomerBuyGoodsOnline';
}

export interface C2BSimulateResponse {
  OriginatorCoversationID: string;
  ResponseCode: string;
  ResponseDescription: string;
}

export interface B2CRequest {
  amount: number;
  phone: string;
  commandId?: 'BusinessPayment' | 'SalaryPayment' | 'PromotionPayment';
  occasion?: string;
  remarks?: string;
  resultUrl?: string;
  timeoutUrl?: string;
}

export interface B2CResponse {
  ConversationID: string;
  OriginatorConversationID: string;
  ResponseCode: string;
  ResponseDescription: string;
}

export interface TransactionStatusRequest {
  transactionId: string;
  occasion?: string;
  remarks?: string;
  resultUrl?: string;
  timeoutUrl?: string;
}

export interface TransactionStatusResponse {
  OriginatorConversationID: string;
  ConversationID: string;
  ResponseCode: string;
  ResponseDescription: string;
}

export interface MpesaApiResponse {
  ResponseCode?: string;
  ResponseDescription?: string;
  errorCode?: string;
  errorMessage?: string;
  [key: string]: unknown;
}

export interface RetryConfig {
  maxRetries: number;
  initialDelay: number;
  maxDelay: number;
  backoffMultiplier: number;
}

export interface CallbackMetadataItem {
  Name: string;
  Value: string | number;
}

export interface MpesaCallback {
  Body: {
    stkCallback?: {
      MerchantRequestID: string;
      CheckoutRequestID: string;
      ResultCode: number;
      ResultDesc: string;
      CallbackMetadata?: {
        Item: CallbackMetadataItem[];
      };
    };
  };
}
