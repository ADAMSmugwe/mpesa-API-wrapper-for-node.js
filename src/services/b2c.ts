
import { AxiosInstance } from 'axios';
import { B2CRequest, B2CResponse, MpesaConfig } from '../core/types';
import { TokenManager } from '../core/token';
import { formatPhoneNumber, validateAmount, validateUrl } from '../core/utils';
import { ValidationError, MissingConfigError } from '../core/errors';
import { executeWithRetry, addAuthHeader } from '../core/client';

export class B2CService {
  private readonly httpClient: AxiosInstance;
  private readonly tokenManager: TokenManager;
  private readonly config: MpesaConfig;

  constructor(httpClient: AxiosInstance, tokenManager: TokenManager, config: MpesaConfig) {
    this.httpClient = httpClient;
    this.tokenManager = tokenManager;
    this.config = config;
  }

  public async sendPayment(params: B2CRequest): Promise<B2CResponse> {
    this.validateB2CParams(params);

    const { amount, phone, commandId, occasion, remarks, resultUrl, timeoutUrl } = params;

    
    const formattedPhone = formatPhoneNumber(phone);

    
    validateAmount(amount);

    
    const finalResultUrl = resultUrl || this.getDefaultResultUrl();
    const finalTimeoutUrl = timeoutUrl || this.getDefaultTimeoutUrl();

    if (finalResultUrl) {
      validateUrl(finalResultUrl, 'resultUrl');
    }
    if (finalTimeoutUrl) {
      validateUrl(finalTimeoutUrl, 'timeoutUrl');
    }

    
    if (!this.config.initiatorName) {
      throw new MissingConfigError('initiatorName');
    }
    if (!this.config.securityCredential) {
      throw new MissingConfigError('securityCredential');
    }

    
    const requestBody = {
      InitiatorName: this.config.initiatorName,
      SecurityCredential: this.config.securityCredential,
      CommandID: commandId || 'BusinessPayment',
      Amount: Math.round(amount),
      PartyA: this.config.shortcode,
      PartyB: formattedPhone,
      Remarks: remarks || 'B2C Payment',
      QueueTimeOutURL: finalTimeoutUrl,
      ResultURL: finalResultUrl,
      Occasion: occasion || 'Payment',
    };

    
    const token = await this.tokenManager.getToken();

    
    const response = await executeWithRetry(
      async () => {
        const res = await this.httpClient.post<B2CResponse>(
          '/mpesa/b2c/v1/paymentrequest',
          requestBody,
          addAuthHeader({}, token),
        );
        return res.data;
      },
      this.config.maxRetries || 3,
    );

    return response;
  }

  private validateB2CParams(params: B2CRequest): void {
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

  private getDefaultResultUrl(): string {
    return '';
  }

  private getDefaultTimeoutUrl(): string {
    return '';
  }
}

export function createB2CService(
  httpClient: AxiosInstance,
  tokenManager: TokenManager,
  config: MpesaConfig,
): B2CService {
  return new B2CService(httpClient, tokenManager, config);
}
