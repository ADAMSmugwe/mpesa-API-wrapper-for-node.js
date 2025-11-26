
import { AxiosInstance } from 'axios';
import {
  StkPushRequest,
  StkPushResponse,
  StkQueryRequest,
  StkQueryResponse,
  MpesaConfig,
} from '../core/types';
import { TokenManager } from '../core/token';
import {
  formatPhoneNumber,
  validateAmount,
  generateTimestamp,
  generatePassword,
  validateUrl,
} from '../core/utils';
import { MissingConfigError, ValidationError } from '../core/errors';
import { executeWithRetry, addAuthHeader } from '../core/client';

export class StkService {
  private readonly httpClient: AxiosInstance;
  private readonly tokenManager: TokenManager;
  private readonly config: MpesaConfig;

  constructor(httpClient: AxiosInstance, tokenManager: TokenManager, config: MpesaConfig) {
    this.httpClient = httpClient;
    this.tokenManager = tokenManager;
    this.config = config;
  }

  public async initiateSTKPush(params: StkPushRequest): Promise<StkPushResponse> {
    this.validateSTKPushParams(params);

    const { amount, phone, accountReference, transactionDesc, callbackUrl } = params;

    
    const formattedPhone = formatPhoneNumber(phone);

    
    validateAmount(amount);

    
    const timestamp = generateTimestamp();
    const password = generatePassword(this.config.shortcode, this.config.passkey, timestamp);

    
    const finalCallbackUrl = callbackUrl || this.getDefaultCallbackUrl();
    if (finalCallbackUrl) {
      validateUrl(finalCallbackUrl, 'callbackUrl');
    }

    
    const requestBody = {
      BusinessShortCode: this.config.shortcode,
      Password: password,
      Timestamp: timestamp,
      TransactionType: 'CustomerPayBillOnline',
      Amount: Math.round(amount),
      PartyA: formattedPhone,
      PartyB: this.config.shortcode,
      PhoneNumber: formattedPhone,
      CallBackURL: finalCallbackUrl,
      AccountReference: accountReference,
      TransactionDesc: transactionDesc || accountReference,
    };

    
    const token = await this.tokenManager.getToken();

    
    const response = await executeWithRetry(
      async () => {
        const res = await this.httpClient.post<StkPushResponse>(
          '/mpesa/stkpush/v1/processrequest',
          requestBody,
          addAuthHeader({}, token),
        );
        return res.data;
      },
      this.config.maxRetries || 3,
    );

    return response;
  }

  public async querySTKPush(params: StkQueryRequest): Promise<StkQueryResponse> {
    const { checkoutRequestId } = params;

    if (!checkoutRequestId) {
      throw new ValidationError('CheckoutRequestID is required');
    }

    
    const timestamp = generateTimestamp();
    const password = generatePassword(this.config.shortcode, this.config.passkey, timestamp);

    
    const requestBody = {
      BusinessShortCode: this.config.shortcode,
      Password: password,
      Timestamp: timestamp,
      CheckoutRequestID: checkoutRequestId,
    };

    
    const token = await this.tokenManager.getToken();

    
    const response = await executeWithRetry(
      async () => {
        const res = await this.httpClient.post<StkQueryResponse>(
          '/mpesa/stkpushquery/v1/query',
          requestBody,
          addAuthHeader({}, token),
        );
        return res.data;
      },
      this.config.maxRetries || 3,
    );

    return response;
  }

  private validateSTKPushParams(params: StkPushRequest): void {
    if (!params.amount) {
      throw new ValidationError('Amount is required');
    }
    if (!params.phone) {
      throw new ValidationError('Phone number is required');
    }
    if (!params.accountReference) {
      throw new ValidationError('Account reference is required');
    }
    if (!this.config.shortcode) {
      throw new MissingConfigError('shortcode');
    }
    if (!this.config.passkey) {
      throw new MissingConfigError('passkey');
    }
  }

  private getDefaultCallbackUrl(): string {
    return '';
  }
}

export function createStkService(
  httpClient: AxiosInstance,
  tokenManager: TokenManager,
  config: MpesaConfig,
): StkService {
  return new StkService(httpClient, tokenManager, config);
}
