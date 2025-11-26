
import { AxiosInstance } from 'axios';
import {
  C2BRegisterRequest,
  C2BRegisterResponse,
  C2BSimulateRequest,
  C2BSimulateResponse,
  MpesaConfig,
} from '../core/types';
import { TokenManager } from '../core/token';
import { formatPhoneNumber, validateAmount, validateUrl } from '../core/utils';
import { ValidationError, MissingConfigError } from '../core/errors';
import { executeWithRetry, addAuthHeader } from '../core/client';

export class C2BService {
  private readonly httpClient: AxiosInstance;
  private readonly tokenManager: TokenManager;
  private readonly config: MpesaConfig;

  constructor(httpClient: AxiosInstance, tokenManager: TokenManager, config: MpesaConfig) {
    this.httpClient = httpClient;
    this.tokenManager = tokenManager;
    this.config = config;
  }

  public async registerUrls(params: C2BRegisterRequest): Promise<C2BRegisterResponse> {
    this.validateRegisterParams(params);

    const { validationUrl, confirmationUrl, responseType, shortcode } = params;

    
    validateUrl(validationUrl, 'validationUrl');
    validateUrl(confirmationUrl, 'confirmationUrl');

    
    const requestBody = {
      ShortCode: shortcode || this.config.shortcode,
      ResponseType: responseType || 'Completed',
      ConfirmationURL: confirmationUrl,
      ValidationURL: validationUrl,
    };

    
    const token = await this.tokenManager.getToken();

    
    const response = await executeWithRetry(
      async () => {
        const res = await this.httpClient.post<C2BRegisterResponse>(
          '/mpesa/c2b/v1/registerurl',
          requestBody,
          addAuthHeader({}, token),
        );
        return res.data;
      },
      this.config.maxRetries || 3,
    );

    return response;
  }

  public async simulatePayment(params: C2BSimulateRequest): Promise<C2BSimulateResponse> {
    this.validateSimulateParams(params);

    const { amount, phone, billRefNumber, commandId } = params;

    
    const formattedPhone = formatPhoneNumber(phone);

    
    validateAmount(amount);

    
    const requestBody = {
      ShortCode: this.config.shortcode,
      CommandID: commandId || 'CustomerPayBillOnline',
      Amount: Math.round(amount),
      Msisdn: formattedPhone,
      BillRefNumber: billRefNumber || 'TestPayment',
    };

    
    const token = await this.tokenManager.getToken();

    
    const response = await executeWithRetry(
      async () => {
        const res = await this.httpClient.post<C2BSimulateResponse>(
          '/mpesa/c2b/v1/simulate',
          requestBody,
          addAuthHeader({}, token),
        );
        return res.data;
      },
      this.config.maxRetries || 3,
    );

    return response;
  }

  private validateRegisterParams(params: C2BRegisterRequest): void {
    if (!params.validationUrl) {
      throw new ValidationError('Validation URL is required');
    }
    if (!params.confirmationUrl) {
      throw new ValidationError('Confirmation URL is required');
    }
    if (!this.config.shortcode) {
      throw new MissingConfigError('shortcode');
    }
  }

  private validateSimulateParams(params: C2BSimulateRequest): void {
    if (!params.amount) {
      throw new ValidationError('Amount is required');
    }
    if (!params.phone) {
      throw new ValidationError('Phone number is required');
    }
    if (!this.config.shortcode) {
      throw new MissingConfigError('shortcode');
    }
  }
}

export function createC2BService(
  httpClient: AxiosInstance,
  tokenManager: TokenManager,
  config: MpesaConfig,
): C2BService {
  return new C2BService(httpClient, tokenManager, config);
}
