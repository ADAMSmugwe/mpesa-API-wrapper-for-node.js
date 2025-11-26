import axios, { AxiosInstance, AxiosError, AxiosRequestConfig } from 'axios';
import { MpesaConfig, MpesaEnvironment } from './types';
import {
  MpesaNetworkError,
  MpesaResponseError,
  TimeoutError,
  MaxRetriesExceededError,
} from './errors';
import { calculateBackoff, sleep } from './utils';

const BASE_URLS = {
  sandbox: 'https://sandbox.safaricom.co.ke',
  production: 'https://api.safaricom.co.ke',
} as const;

export function getBaseUrl(environment: MpesaEnvironment): string {
  return BASE_URLS[environment];
}

export function createHttpClient(config: MpesaConfig): AxiosInstance {
  const baseURL = getBaseUrl(config.environment);
  const timeout = config.timeout || 30000;

  const instance = axios.create({
    baseURL,
    timeout,
    headers: {
      'Content-Type': 'application/json',
      Accept: 'application/json',
    },
  });

  instance.interceptors.request.use(
    (requestConfig) => {
      return requestConfig;
    },
    (error) => {
      return Promise.reject(error);
    },
  );

  instance.interceptors.response.use(
    (response) => response,
    (error: AxiosError) => {
      return Promise.reject(transformAxiosError(error));
    },
  );

  return instance;
}

function transformAxiosError(error: AxiosError): Error {
  if (error.code === 'ECONNABORTED' || error.code === 'ETIMEDOUT') {
    return new TimeoutError('Request timed out');
  }

  if (!error.response) {
    return new MpesaNetworkError(
      error.message || 'Network error occurred',
      error.toJSON(),
    );
  }

  const { status, data } = error.response;
  const responseData = data as any;

  const errorMessage =
    responseData?.errorMessage ||
    responseData?.ResponseDescription ||
    responseData?.message ||
    error.message ||
    'Unknown error occurred';

  const responseCode =
    responseData?.errorCode || responseData?.ResponseCode || String(status);

  return new MpesaResponseError(errorMessage, responseCode, status, responseData);
}

const DEFAULT_RETRY_CONFIG = {
  maxRetries: 3,
  initialDelay: 1000,
  maxDelay: 10000,
  backoffMultiplier: 2,
};

export async function executeWithRetry<T>(
  requestFn: () => Promise<T>,
  maxRetries: number = DEFAULT_RETRY_CONFIG.maxRetries,
): Promise<T> {
  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      return await requestFn();
    } catch (error) {
      if (
        error instanceof MpesaResponseError &&
        !shouldRetry(error.statusCode)
      ) {
        throw error;
      }

      if (attempt === maxRetries) {
        throw new MaxRetriesExceededError(maxRetries + 1);
      }

      const delay = calculateBackoff(
        attempt,
        DEFAULT_RETRY_CONFIG.initialDelay,
        DEFAULT_RETRY_CONFIG.maxDelay,
        DEFAULT_RETRY_CONFIG.backoffMultiplier,
      );

      await sleep(delay);
    }
  }

  throw new MaxRetriesExceededError(maxRetries + 1);
}

function shouldRetry(statusCode?: number): boolean {
  if (!statusCode) return true;

  if (statusCode >= 500 || statusCode === 429) {
    return true;
  }

  if (statusCode >= 400 && statusCode < 500) {
    return false;
  }

  return true;
}

export function addAuthHeader(
  config: AxiosRequestConfig,
  token: string,
): AxiosRequestConfig {
  return {
    ...config,
    headers: {
      ...config.headers,
      Authorization: `Bearer ${token}`,
    },
  };
}
