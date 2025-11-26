/**
 * Tests for utility functions
 */

import {
  formatPhoneNumber,
  validateAmount,
  validateUrl,
  generateTimestamp,
  generatePassword,
  calculateBackoff,
  sanitizeForLogging,
  isValidShortcode,
  parseCallbackMetadata,
} from '../src/core/utils';
import {
  InvalidPhoneNumberError,
  InvalidAmountError,
  InvalidUrlError,
} from '../src/core/errors';

describe('Utils - formatPhoneNumber', () => {
  it('should format phone number starting with 0', () => {
    expect(formatPhoneNumber('0712345678')).toBe('254712345678');
  });

  it('should format phone number starting with 7', () => {
    expect(formatPhoneNumber('712345678')).toBe('254712345678');
  });

  it('should format phone number starting with +254', () => {
    expect(formatPhoneNumber('+254712345678')).toBe('254712345678');
  });

  it('should accept phone number already in correct format', () => {
    expect(formatPhoneNumber('254712345678')).toBe('254712345678');
  });

  it('should handle phone numbers with spaces and dashes', () => {
    expect(formatPhoneNumber('0712-345-678')).toBe('254712345678');
    expect(formatPhoneNumber('0712 345 678')).toBe('254712345678');
  });

  it('should throw error for invalid phone number', () => {
    expect(() => formatPhoneNumber('123')).toThrow(InvalidPhoneNumberError);
    expect(() => formatPhoneNumber('0612345678')).toThrow(InvalidPhoneNumberError);
    expect(() => formatPhoneNumber('254612345678')).toThrow(InvalidPhoneNumberError);
  });

  it('should accept both 7 and 1 prefixes', () => {
    expect(formatPhoneNumber('0712345678')).toBe('254712345678');
    expect(formatPhoneNumber('0112345678')).toBe('254112345678');
  });
});

describe('Utils - validateAmount', () => {
  it('should accept valid amounts', () => {
    expect(() => validateAmount(100)).not.toThrow();
    expect(() => validateAmount(1)).not.toThrow();
    expect(() => validateAmount(0.01)).not.toThrow();
  });

  it('should throw error for invalid amounts', () => {
    expect(() => validateAmount(0)).toThrow(InvalidAmountError);
    expect(() => validateAmount(-10)).toThrow(InvalidAmountError);
    expect(() => validateAmount(NaN)).toThrow(InvalidAmountError);
    expect(() => validateAmount(Infinity)).toThrow(InvalidAmountError);
  });
});

describe('Utils - validateUrl', () => {
  it('should accept valid HTTPS URLs', () => {
    expect(() => validateUrl('https://example.com', 'testUrl')).not.toThrow();
    expect(() =>
      validateUrl('https://example.com/path/to/callback', 'testUrl'),
    ).not.toThrow();
  });

  it('should throw error for HTTP URLs', () => {
    expect(() => validateUrl('http://example.com', 'testUrl')).toThrow(InvalidUrlError);
  });

  it('should throw error for invalid URLs', () => {
    expect(() => validateUrl('not-a-url', 'testUrl')).toThrow(InvalidUrlError);
    expect(() => validateUrl('ftp://example.com', 'testUrl')).toThrow(InvalidUrlError);
  });
});

describe('Utils - generateTimestamp', () => {
  it('should generate timestamp in correct format', () => {
    const timestamp = generateTimestamp(new Date('2024-01-15T10:30:45'));
    expect(timestamp).toBe('20240115103045');
  });

  it('should use current time when no date provided', () => {
    const timestamp = generateTimestamp();
    expect(timestamp).toMatch(/^\d{14}$/);
  });

  it('should pad single digits correctly', () => {
    const timestamp = generateTimestamp(new Date('2024-01-05T08:05:09'));
    expect(timestamp).toBe('20240105080509');
  });
});

describe('Utils - generatePassword', () => {
  it('should generate correct password', () => {
    const shortcode = '174379';
    const passkey = 'testpasskey';
    const timestamp = '20240115103045';

    const password = generatePassword(shortcode, passkey, timestamp);
    const expected = Buffer.from(shortcode + passkey + timestamp).toString('base64');

    expect(password).toBe(expected);
  });
});

describe('Utils - calculateBackoff', () => {
  it('should calculate exponential backoff correctly', () => {
    expect(calculateBackoff(0, 1000, 10000)).toBe(1000);
    expect(calculateBackoff(1, 1000, 10000)).toBe(2000);
    expect(calculateBackoff(2, 1000, 10000)).toBe(4000);
    expect(calculateBackoff(3, 1000, 10000)).toBe(8000);
  });

  it('should respect maximum delay', () => {
    expect(calculateBackoff(10, 1000, 5000)).toBe(5000);
    expect(calculateBackoff(20, 1000, 10000)).toBe(10000);
  });

  it('should use custom multiplier', () => {
    expect(calculateBackoff(1, 1000, 50000, 3)).toBe(3000);
    expect(calculateBackoff(2, 1000, 50000, 3)).toBe(9000);
  });
});

describe('Utils - sanitizeForLogging', () => {
  it('should redact sensitive fields', () => {
    const data = {
      username: 'testuser',
      password: 'secret123',
      consumerKey: 'key123',
      amount: 100,
    };

    const sanitized = sanitizeForLogging(data);

    expect(sanitized.username).toBe('testuser');
    expect(sanitized.password).toBe('***REDACTED***');
    expect(sanitized.consumerKey).toBe('***REDACTED***');
    expect(sanitized.amount).toBe(100);
  });

  it('should handle nested objects', () => {
    const data = {
      user: {
        name: 'John',
        password: 'secret',
      },
      apiKey: 'key123',
    };

    const sanitized = sanitizeForLogging(data);

    expect(sanitized.user.name).toBe('John');
    expect(sanitized.user.password).toBe('***REDACTED***');
  });
});

describe('Utils - isValidShortcode', () => {
  it('should accept valid shortcodes', () => {
    expect(isValidShortcode('174379')).toBe(true);
    expect(isValidShortcode('12345')).toBe(true);
    expect(isValidShortcode('1234567')).toBe(true);
  });

  it('should reject invalid shortcodes', () => {
    expect(isValidShortcode('1234')).toBe(false);
    expect(isValidShortcode('12345678')).toBe(false);
    expect(isValidShortcode('abc123')).toBe(false);
  });
});

describe('Utils - parseCallbackMetadata', () => {
  it('should parse metadata items correctly', () => {
    const items = [
      { Name: 'Amount', Value: 100 },
      { Name: 'PhoneNumber', Value: '254712345678' },
    ];

    const parsed = parseCallbackMetadata(items);

    expect(parsed.Amount).toBe(100);
    expect(parsed.PhoneNumber).toBe('254712345678');
  });

  it('should handle empty array', () => {
    const parsed = parseCallbackMetadata([]);
    expect(parsed).toEqual({});
  });
});
