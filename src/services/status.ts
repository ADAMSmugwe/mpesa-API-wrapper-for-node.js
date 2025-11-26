
import { AxiosInstance } from 'axios';
import {
  TransactionStatusRequest,
  TransactionStatusResponse,
  MpesaConfig,
} from '../core/types';
import { TokenManager } from '../core/token';
import { validateUrl } from '../core/utils';
import { ValidationError, MissingConfigError } from '../core/errors';
import { executeWithRetry, addAuthHeader } from '../core/client';

export class TransactionStatusService {
  private readonly httpClient: AxiosInstance;
  private readonly tokenManager: TokenManager;
  private readonly config: MpesaConfig;

  constructor(httpClient: AxiosInstance, tokenManager: TokenManager, config: MpesaConfig) {
    this.httpClient = httpClient;
    this.tokenManager = tokenManager;
    this.config = config;
  }

  public async queryStatus(
    params: TransactionStatusRequest,
  ): Promise<TransactionStatusResponse> {
    this.validateStatusParams(params);

    const { transactionId, occasion, remarks, resultUrl, timeoutUrl } = params;

    
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
      Initiator: this.config.initiatorName,
      SecurityCredential: this.config.securityCredential,
      CommandID: 'TransactionStatusQuery',
      TransactionID: transactionId,
      PartyA: this.config.shortcode,
      IdentifierType: '4', 
      ResultURL: finalResultUrl,
      QueueTimeOutURL: finalTimeoutUrl,
      Remarks: remarks || 'Transaction Status Query',
      Occasion: occasion || 'Query',
    };

    
    const token = await this.tokenManager.getToken();

    
    const response = await executeWithRetry(
      async () => {
        const res = await this.httpClient.post<TransactionStatusResponse>(
          '/mpesa/transactionstatus/v1/query',
          requestBody,
          addAuthHeader({}, token),
        );
        return res.data;
      },
      this.config.maxRetries || 3,
    );

    return response;
  }

  private validateStatusParams(params: TransactionStatusRequest): void {
    if (!params.transactionId) {
      throw new ValidationError('Transaction ID is required');
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

export function createTransactionStatusService(
  httpClient: AxiosInstance,
  tokenManager: TokenManager,
  config: MpesaConfig,
): TransactionStatusService {
  return new TransactionStatusService(httpClient, tokenManager, config);
}
