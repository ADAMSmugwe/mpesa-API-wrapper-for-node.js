/**
 * Tests for C2B Service
 */

import { Mpesa } from '../src/index';
import { MpesaConfig } from '../src/core/types';
import { ValidationError } from '../src/core/errors';

describe('C2B Service', () => {
  let mpesa: Mpesa;
  let config: MpesaConfig;

  beforeEach(() => {
    config = {
      consumerKey: 'test_key',
      consumerSecret: 'test_secret',
      shortcode: '174379',
      passkey: 'test_passkey',
      environment: 'sandbox',
    };

    mpesa = new Mpesa(config);
  });

  describe('c2bRegister', () => {
    it('should validate required URLs', async () => {
      await expect(
        mpesa.c2bRegister({
          validationUrl: '',
          confirmationUrl: 'https://example.com/confirm',
        }),
      ).rejects.toThrow(ValidationError);
    });

    it('should validate HTTPS URLs', async () => {
      await expect(
        mpesa.c2bRegister({
          validationUrl: 'http://example.com/validate',
          confirmationUrl: 'https://example.com/confirm',
        }),
      ).rejects.toThrow();
    });
  });

  describe('c2bSimulate', () => {
    it('should validate required parameters', async () => {
      await expect(
        mpesa.c2bSimulate({
          amount: 0,
          phone: '0712345678',
        }),
      ).rejects.toThrow();
    });

    it('should throw error for invalid phone', async () => {
      await expect(
        mpesa.c2bSimulate({
          amount: 100,
          phone: '123',
        }),
      ).rejects.toThrow();
    });
  });
});
