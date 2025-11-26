/**
 * Tests for Token Manager
 */

import axios from 'axios';
import MockAdapter from 'axios-mock-adapter';
import { TokenManager } from '../src/core/token';
import { createHttpClient } from '../src/core/client';
import { MpesaConfig } from '../src/core/types';
import { MpesaAuthError } from '../src/core/errors';

describe('TokenManager', () => {
  let mock: MockAdapter;
  let config: MpesaConfig;
  let tokenManager: TokenManager;

  beforeEach(() => {
    config = {
      consumerKey: 'test_key',
      consumerSecret: 'test_secret',
      shortcode: '174379',
      passkey: 'test_passkey',
      environment: 'sandbox',
    };

    const httpClient = createHttpClient(config);
    mock = new MockAdapter(httpClient);
    tokenManager = new TokenManager(httpClient, config);
  });

  afterEach(() => {
    mock.reset();
    tokenManager.clearCache();
  });

  describe('getToken', () => {
    it('should generate token on first call', async () => {
      mock
        .onGet('/oauth/v1/generate?grant_type=client_credentials')
        .reply(200, {
          access_token: 'test_token_123',
          expires_in: '3599',
        });

      const token = await tokenManager.getToken();

      expect(token).toBe('test_token_123');
      expect(mock.history.get.length).toBe(1);
    });

    it('should return cached token if still valid', async () => {
      mock
        .onGet('/oauth/v1/generate?grant_type=client_credentials')
        .reply(200, {
          access_token: 'test_token_123',
          expires_in: '3599',
        });

      const token1 = await tokenManager.getToken();
      const token2 = await tokenManager.getToken();

      expect(token1).toBe(token2);
      expect(mock.history.get.length).toBe(1); // Only one request
    });

    it('should refresh token if expired', async () => {
      // First token with short expiry
      mock
        .onGet('/oauth/v1/generate?grant_type=client_credentials')
        .replyOnce(200, {
          access_token: 'token_1',
          expires_in: '1', // 1 second
        })
        .onGet('/oauth/v1/generate?grant_type=client_credentials')
        .replyOnce(200, {
          access_token: 'token_2',
          expires_in: '3599',
        });

      const token1 = await tokenManager.getToken();
      expect(token1).toBe('token_1');

      // Wait for token to expire
      await new Promise((resolve) => setTimeout(resolve, 1100));

      const token2 = await tokenManager.getToken();
      expect(token2).toBe('token_2');
      expect(mock.history.get.length).toBe(2);
    });

    it('should handle concurrent token requests', async () => {
      mock
        .onGet('/oauth/v1/generate?grant_type=client_credentials')
        .reply(200, {
          access_token: 'test_token',
          expires_in: '3599',
        });

      const [token1, token2, token3] = await Promise.all([
        tokenManager.getToken(),
        tokenManager.getToken(),
        tokenManager.getToken(),
      ]);

      expect(token1).toBe('test_token');
      expect(token2).toBe('test_token');
      expect(token3).toBe('test_token');
      expect(mock.history.get.length).toBe(1); // Should only make one request
    });
  });

  describe('refreshToken', () => {
    it('should force refresh even if cached token is valid', async () => {
      mock
        .onGet('/oauth/v1/generate?grant_type=client_credentials')
        .replyOnce(200, {
          access_token: 'token_1',
          expires_in: '3599',
        })
        .onGet('/oauth/v1/generate?grant_type=client_credentials')
        .replyOnce(200, {
          access_token: 'token_2',
          expires_in: '3599',
        });

      await tokenManager.getToken();
      const newToken = await tokenManager.refreshToken();

      expect(newToken).toBe('token_2');
      expect(mock.history.get.length).toBe(2);
    });

    it('should throw MpesaAuthError on authentication failure', async () => {
      mock.onGet('/oauth/v1/generate?grant_type=client_credentials').reply(401, {
        errorMessage: 'Invalid credentials',
      });

      await expect(tokenManager.refreshToken()).rejects.toThrow(MpesaAuthError);
    }, 10000); // Increase timeout for this test
  });

  describe('clearCache', () => {
    it('should clear cached token', async () => {
      mock
        .onGet('/oauth/v1/generate?grant_type=client_credentials')
        .reply(200, {
          access_token: 'test_token',
          expires_in: '3599',
        });

      await tokenManager.getToken();
      expect(tokenManager.hasCachedToken()).toBe(true);

      tokenManager.clearCache();
      expect(tokenManager.hasCachedToken()).toBe(false);
    });
  });

  describe('getTokenExpiry', () => {
    it('should return null when no token is cached', () => {
      expect(tokenManager.getTokenExpiry()).toBeNull();
    });

    it('should return expiry timestamp when token is cached', async () => {
      mock
        .onGet('/oauth/v1/generate?grant_type=client_credentials')
        .reply(200, {
          access_token: 'test_token',
          expires_in: '3599',
        });

      await tokenManager.getToken();
      const expiry = tokenManager.getTokenExpiry();

      expect(expiry).not.toBeNull();
      expect(typeof expiry).toBe('number');
      expect(expiry! > Date.now()).toBe(true);
    });
  });

  describe('getTimeUntilExpiry', () => {
    it('should return 0 when no token is cached', () => {
      expect(tokenManager.getTimeUntilExpiry()).toBe(0);
    });

    it('should return time remaining until expiry', async () => {
      mock
        .onGet('/oauth/v1/generate?grant_type=client_credentials')
        .reply(200, {
          access_token: 'test_token',
          expires_in: '3599',
        });

      await tokenManager.getToken();
      const timeRemaining = tokenManager.getTimeUntilExpiry();

      expect(timeRemaining).toBeGreaterThan(0);
      expect(timeRemaining).toBeLessThanOrEqual(3599000);
    });
  });
});
