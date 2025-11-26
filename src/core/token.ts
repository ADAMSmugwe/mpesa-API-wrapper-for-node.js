
import { AxiosInstance } from 'axios';
import { TokenResponse, CachedToken, MpesaConfig } from './types';
import { MpesaAuthError } from './errors';
import { executeWithRetry } from './client';

export class TokenManager {
  private cachedToken: CachedToken | null = null;
  private refreshPromise: Promise<string> | null = null;
  private readonly httpClient: AxiosInstance;
  private readonly config: MpesaConfig;

  constructor(httpClient: AxiosInstance, config: MpesaConfig) {
    this.httpClient = httpClient;
    this.config = config;
  }

  public async getToken(): Promise<string> {
    if (this.cachedToken && this.isTokenValid(this.cachedToken)) {
      return this.cachedToken.token;
    }

    
    if (this.refreshPromise) {
      return this.refreshPromise;
    }

    
    this.refreshPromise = this.refreshToken();

    try {
      const token = await this.refreshPromise;
      return token;
    } finally {
      this.refreshPromise = null;
    }
  }

  public async refreshToken(): Promise<string> {
    try {
      const token = await executeWithRetry(
        () => this.generateToken(),
        this.config.maxRetries || 3,
      );

      return token;
    } catch (error) {
      this.cachedToken = null;
      throw new MpesaAuthError(
        'Failed to generate access token',
        undefined,
        error,
      );
    }
  }

  private async generateToken(): Promise<string> {
    const { consumerKey, consumerSecret } = this.config;

    
    const credentials = Buffer.from(`${consumerKey}:${consumerSecret}`).toString('base64');

    try {
      const response = await this.httpClient.get<TokenResponse>(
        '/oauth/v1/generate?grant_type=client_credentials',
        {
          headers: {
            Authorization: `Basic ${credentials}`,
          },
        },
      );

      const { access_token, expires_in } = response.data;

      
      const expiresInSeconds = parseInt(expires_in, 10);
      const expiresAt = Date.now() + (expiresInSeconds * 1000);

      
      this.cachedToken = {
        token: access_token,
        expiresAt: expiresAt - 60000,
      };

      return access_token;
    } catch (error: any) {
      throw new MpesaAuthError(
        error.message || 'Failed to generate OAuth token',
        error.statusCode,
        error,
      );
    }
  }

  private isTokenValid(cached: CachedToken): boolean {
    return Date.now() < cached.expiresAt;
  }

  public clearCache(): void {
    this.cachedToken = null;
  }

  public getTokenExpiry(): number | null {
    return this.cachedToken ? this.cachedToken.expiresAt : null;
  }

  public hasCachedToken(): boolean {
    return this.cachedToken !== null;
  }

  public getTimeUntilExpiry(): number {
    if (!this.cachedToken) return 0;
    const remaining = this.cachedToken.expiresAt - Date.now();
    return Math.max(0, remaining);
  }
}

export function createTokenManager(
  httpClient: AxiosInstance,
  config: MpesaConfig,
): TokenManager {
  return new TokenManager(httpClient, config);
}
