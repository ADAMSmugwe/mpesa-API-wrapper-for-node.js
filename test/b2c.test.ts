/**
 * Tests for B2C Service
 */

import { Mpesa } from '../src/index';
import { MpesaConfig } from '../src/core/types';
import { ValidationError, MissingConfigError } from '../src/core/errors';

describe('B2C Service', () => {
  let mpesa: Mpesa;
  let config: MpesaConfig;

  beforeEach(() => {
    config = {
      consumerKey: 'test_key',
      consumerSecret: 'test_secret',
      shortcode: '174379',
      passkey: 'test_passkey',
      environment: 'sandbox',
      initiatorName: 'testapi',
      securityCredential: 'test_credential',
    };

    mpesa = new Mpesa(config);
  });

  describe('b2c', () => {
    it('should validate required parameters', async () => {
      await expect(
        mpesa.b2c({
          amount: 0,
          phone: '0712345678',
        }),
      ).rejects.toThrow();
    });

    it('should require initiator credentials', async () => {
      const badConfig = { ...config };
      delete badConfig.initiatorName;
      delete badConfig.securityCredential;

      const badMpesa = new Mpesa(badConfig);

      await expect(
        badMpesa.b2c({
          amount: 100,
          phone: '0712345678',
          resultUrl: 'https://example.com/result',
          timeoutUrl: 'https://example.com/timeout',
        }),
      ).rejects.toThrow(MissingConfigError);
    });

    it('should throw error for invalid amount', async () => {
      await expect(
        mpesa.b2c({
          amount: -100,
          phone: '0712345678',
        }),
      ).rejects.toThrow();
    });

    it('should throw error for invalid phone', async () => {
      await expect(
        mpesa.b2c({
          amount: 100,
          phone: '123',
        }),
      ).rejects.toThrow();
    });
  });
});
