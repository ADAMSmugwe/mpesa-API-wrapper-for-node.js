export class MpesaError extends Error {
  public readonly statusCode?: number;
  public readonly details?: unknown;

  constructor(message: string, statusCode?: number, details?: unknown) {
    super(message);
    this.name = this.constructor.name;
    this.statusCode = statusCode;
    this.details = details;
    
    if (typeof (Error as any).captureStackTrace === 'function') {
      (Error as any).captureStackTrace(this, this.constructor);
    }
  }
}

export class MpesaNetworkError extends MpesaError {
  constructor(message: string, details?: unknown) {
    super(`Network Error: ${message}`, undefined, details);
  }
}

export class MpesaAuthError extends MpesaError {
  constructor(message: string, statusCode?: number, details?: unknown) {
    super(`Authentication Error: ${message}`, statusCode, details);
  }
}

export class InvalidPhoneNumberError extends MpesaError {
  constructor(phone: string) {
    super(
      `Invalid phone number: ${phone}. Phone number must be in format 2547XXXXXXXX (12 digits starting with 254)`,
      400,
    );
  }
}

export class MissingConfigError extends MpesaError {
  constructor(field: string) {
    super(`Missing required configuration: ${field}`, 400);
  }
}

export class MpesaResponseError extends MpesaError {
  public readonly responseCode?: string;

  constructor(message: string, responseCode?: string, statusCode?: number, details?: unknown) {
    super(`MPesa API Error: ${message}`, statusCode, details);
    this.responseCode = responseCode;
  }
}

export class ValidationError extends MpesaError {
  constructor(message: string, details?: unknown) {
    super(`Validation Error: ${message}`, 400, details);
  }
}

export class TimeoutError extends MpesaError {
  constructor(message: string = 'Request timed out') {
    super(message, 408);
  }
}

export class MaxRetriesExceededError extends MpesaError {
  constructor(attempts: number) {
    super(`Maximum retry attempts (${attempts}) exceeded`, 503);
  }
}

export class InvalidUrlError extends MpesaError {
  constructor(url: string, field: string) {
    super(`Invalid URL for ${field}: ${url}. Must be a valid HTTPS URL`, 400);
  }
}

export class InvalidAmountError extends MpesaError {
  constructor(amount: number) {
    super(`Invalid amount: ${amount}. Amount must be a positive number greater than 0`, 400);
  }
}

export class InvalidEnvironmentError extends MpesaError {
  constructor(environment: string) {
    super(
      `Invalid environment: ${environment}. Must be either 'sandbox' or 'production'`,
      400,
    );
  }
}
