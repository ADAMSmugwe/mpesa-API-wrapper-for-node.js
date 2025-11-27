import { InvalidPhoneNumberError, InvalidAmountError, InvalidUrlError } from './errors';

export function formatPhoneNumber(phone: string): string {
  let cleaned = phone.replace(/\D/g, '');

  if (cleaned.startsWith('0')) {
    cleaned = '254' + cleaned.substring(1);
  } else if (cleaned.startsWith('7')) {
    cleaned = '254' + cleaned;
  } else if (cleaned.startsWith('+254')) {
    cleaned = cleaned;
  } else if (cleaned.startsWith('254')) {
    cleaned = cleaned;
  }

  if (!/^254[17]\d{8}$/.test(cleaned)) {
    throw new InvalidPhoneNumberError(phone);
  }

  return cleaned;
}

export function validateAmount(amount: number): void {
  if (!Number.isFinite(amount) || amount <= 0) {
    throw new InvalidAmountError(amount);
  }
}

export function validateUrl(url: string, fieldName: string): void {
  try {
    const parsedUrl = new URL(url);
    if (parsedUrl.protocol !== 'https:') {
      throw new InvalidUrlError(url, fieldName);
    }
  } catch {
    throw new InvalidUrlError(url, fieldName);
  }
}

export function generateTimestamp(date: Date = new Date()): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  const hours = String(date.getHours()).padStart(2, '0');
  const minutes = String(date.getMinutes()).padStart(2, '0');
  const seconds = String(date.getSeconds()).padStart(2, '0');

  return `${year}${month}${day}${hours}${minutes}${seconds}`;
}

export function generatePassword(shortcode: string, passkey: string, timestamp: string): string {
  const str = shortcode + passkey + timestamp;
  return Buffer.from(str).toString('base64');
}

export function generateSecurityCredential(initiatorPassword: string): string {
  return Buffer.from(initiatorPassword).toString('base64');
}

export function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export function calculateBackoff(
  attempt: number,
  initialDelay: number,
  maxDelay: number,
  multiplier: number = 2,
): number {
  const delay = initialDelay * Math.pow(multiplier, attempt);
  return Math.min(delay, maxDelay);
}

export function sanitizeForLogging(data: Record<string, any>): Record<string, any> {
  const sensitiveFields = [
    'password',
    'passkey',
    'consumerKey',
    'consumerSecret',
    'access_token',
    'securityCredential',
  ];

  const sanitized: Record<string, any> = {};

  for (const [key, value] of Object.entries(data)) {
    if (sensitiveFields.some((field) => key.toLowerCase().includes(field.toLowerCase()))) {
      sanitized[key] = '***REDACTED***';
    } else if (typeof value === 'object' && value !== null && !Array.isArray(value)) {
      sanitized[key] = sanitizeForLogging(value);
    } else {
      sanitized[key] = value;
    }
  }

  return sanitized;
}

export function isValidShortcode(shortcode: string): boolean {
  return /^\d{5,7}$/.test(shortcode);
}

export function parseCallbackMetadata(
  items: Array<{ Name: string; Value: string | number }>,
): Record<string, string | number> {
  const metadata: Record<string, string | number> = {};
  
  for (const item of items) {
    metadata[item.Name] = item.Value;
  }
  
  return metadata;
}

export function validateKenyanPhoneNumber(phone: string): boolean {
  const cleaned = phone.replace(/\D/g, '');
  return /^254[17]\d{8}$/.test(cleaned);
}

export function validateRequiredFields(data: Record<string, any>, requiredFields: string[]): void {
  const missingFields: string[] = [];
  
  for (const field of requiredFields) {
    if (data[field] === undefined || data[field] === null || data[field] === '') {
      missingFields.push(field);
    }
  }
  
  if (missingFields.length > 0) {
    throw new Error(`Missing required fields: ${missingFields.join(', ')}`);
  }
}

export function validatePositiveAmount(amount: number, fieldName: string = 'amount'): void {
  if (!Number.isFinite(amount)) {
    throw new Error(`${fieldName} must be a valid number`);
  }
  
  if (amount <= 0) {
    throw new Error(`${fieldName} must be a positive number`);
  }
  
  if (!Number.isInteger(amount)) {
    throw new Error(`${fieldName} must be a whole number (no decimals)`);
  }
}

export function validateShortcode(shortcode: string): void {
  if (!shortcode || typeof shortcode !== 'string') {
    throw new Error('Shortcode is required and must be a string');
  }
  
  if (!/^\d{5,7}$/.test(shortcode)) {
    throw new Error('Shortcode must be 5-7 digits');
  }
}
