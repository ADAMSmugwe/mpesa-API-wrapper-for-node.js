import { AxiosInstance } from 'axios';
import {
  MpesaConfig,
  StkPushRequest,
  StkPushResponse,
  StkQueryRequest,
  StkQueryResponse,
  C2BRegisterRequest,
  C2BRegisterResponse,
  C2BSimulateRequest,
  C2BSimulateResponse,
  B2CRequest,
  B2CResponse,
  TransactionStatusRequest,
  TransactionStatusResponse,
} from './core/types';
import { createHttpClient } from './core/client';
import { createTokenManager, TokenManager } from './core/token';
import { createStkService, StkService } from './services/stk';
import { createC2BService, C2BService } from './services/c2b';
import { createB2CService, B2CService } from './services/b2c';
import {
  createTransactionStatusService,
  TransactionStatusService,
} from './services/status';
import {
  MissingConfigError,
  InvalidEnvironmentError,
} from './core/errors';
import { isValidShortcode } from './core/utils';

export class Mpesa {
  private readonly config: MpesaConfig;
  private readonly httpClient: AxiosInstance;
  private readonly tokenManager: TokenManager;
  private readonly stkService: StkService;
  private readonly c2bService: C2BService;
  private readonly b2cService: B2CService;
  private readonly statusService: TransactionStatusService;

  constructor(config: MpesaConfig) {
    this.validateConfig(config);

    this.config = {
      ...config,
      autoRefreshToken: config.autoRefreshToken ?? true,
      maxRetries: config.maxRetries ?? 3,
      timeout: config.timeout ?? 30000,
    };

    this.httpClient = createHttpClient(this.config);

    this.tokenManager = createTokenManager(this.httpClient, this.config);

    this.stkService = createStkService(this.httpClient, this.tokenManager, this.config);
    this.c2bService = createC2BService(this.httpClient, this.tokenManager, this.config);
    this.b2cService = createB2CService(this.httpClient, this.tokenManager, this.config);
    this.statusService = createTransactionStatusService(
      this.httpClient,
      this.tokenManager,
      this.config,
    );
  }

  public async stkPush(params: StkPushRequest): Promise<StkPushResponse> {
    return this.stkService.initiateSTKPush(params);
  }

  public async stkQuery(params: StkQueryRequest): Promise<StkQueryResponse> {
    return this.stkService.querySTKPush(params);
  }

  public async c2bRegister(params: C2BRegisterRequest): Promise<C2BRegisterResponse> {
    return this.c2bService.registerUrls(params);
  }

  public async c2bSimulate(params: C2BSimulateRequest): Promise<C2BSimulateResponse> {
    return this.c2bService.simulatePayment(params);
  }

  public async b2c(params: B2CRequest): Promise<B2CResponse> {
    return this.b2cService.sendPayment(params);
  }

  public async transactionStatus(
    params: TransactionStatusRequest,
  ): Promise<TransactionStatusResponse> {
    return this.statusService.queryStatus(params);
  }

  public async getAccessToken(): Promise<string> {
    return this.tokenManager.getToken();
  }

  public async refreshAccessToken(): Promise<string> {
    return this.tokenManager.refreshToken();
  }

  public clearTokenCache(): void {
    this.tokenManager.clearCache();
  }

  public getTokenExpiry(): number | null {
    return this.tokenManager.getTokenExpiry();
  }

  private validateConfig(config: MpesaConfig): void {
    if (!config.consumerKey) {
      throw new MissingConfigError('consumerKey');
    }
    if (!config.consumerSecret) {
      throw new MissingConfigError('consumerSecret');
    }
    if (!config.shortcode) {
      throw new MissingConfigError('shortcode');
    }
    if (!config.passkey) {
      throw new MissingConfigError('passkey');
    }
    if (!config.environment) {
      throw new MissingConfigError('environment');
    }

    if (config.environment !== 'sandbox' && config.environment !== 'production') {
      throw new InvalidEnvironmentError(config.environment);
    }

    if (!isValidShortcode(config.shortcode)) {
      throw new MissingConfigError('shortcode (must be 5-7 digits)');
    }
  }
}

export * from './core/types';
export * from './core/errors';
export * from './core/utils';
export * from './middleware/callback';

export default Mpesa;