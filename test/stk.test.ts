/**
 * Tests for STK Push Service
 */

import MockAdapter from 'axios-mock-adapter';
import { Mpesa } from '../src/index';
import { MpesaConfig } from '../src/core/types';
import { ValidationError, MissingConfigError } from '../src/core/errors';

describe('STK Push Service', () => {
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

  describe('stkPush', () => {
    it('should validate required parameters', async () => {
      await expect(
        mpesa.stkPush({
          amount: 0,
          phone: '0712345678',
          accountReference: 'Test',
        }),
      ).rejects.toThrow();
    });

    it('should throw error for missing shortcode', () => {
      const badConfig = { ...config, shortcode: '' };
      expect(() => new Mpesa(badConfig)).toThrow(MissingConfigError);
    });

    it('should throw error for invalid amount', async () => {
      await expect(
        mpesa.stkPush({
          amount: -50,
          phone: '0712345678',
          accountReference: 'Test',
        }),
      ).rejects.toThrow();
    });

    it('should throw error for invalid phone number', async () => {
      await expect(
        mpesa.stkPush({
          amount: 100,
          phone: '123',
          accountReference: 'Test',
        }),
      ).rejects.toThrow();
    });
  });

  describe('stkQuery', () => {
    it('should validate checkoutRequestId', async () => {
      await expect(
        mpesa.stkQuery({
          checkoutRequestId: '',
        }),
      ).rejects.toThrow(ValidationError);
    });
  });
});
