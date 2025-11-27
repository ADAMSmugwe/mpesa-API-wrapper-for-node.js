/**
 * MPesa Module for NestJS
 * 
 * Installation:
 * npm install adams-mpesa-sdk @nestjs/config
 * 
 * Usage:
 * 1. Import MpesaModule in your app.module.ts
 * 2. Inject MpesaService in your controllers/services
 * 3. Use the service methods to interact with MPesa API
 */

import { Module, Injectable, Controller, Post, Get, Body, Param, Query } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import Mpesa, { StkPushRequest, StkQueryRequest } from 'adams-mpesa-sdk';

/**
 * MPesa Service
 * Wraps the Adams MPesa SDK for use in NestJS applications
 */
@Injectable()
export class MpesaService {
  private mpesa: Mpesa;

  constructor(private configService: ConfigService) {
    this.mpesa = new Mpesa({
      consumerKey: this.configService.get<string>('MPESA_CONSUMER_KEY')!,
      consumerSecret: this.configService.get<string>('MPESA_CONSUMER_SECRET')!,
      shortcode: this.configService.get<string>('MPESA_SHORTCODE')!,
      passkey: this.configService.get<string>('MPESA_PASSKEY')!,
      environment: this.configService.get<'sandbox' | 'production'>('MPESA_ENVIRONMENT') || 'sandbox',
    });
  }

  async initiateSTKPush(request: StkPushRequest) {
    return await this.mpesa.stkPush(request);
  }

  async querySTKPush(request: StkQueryRequest) {
    return await this.mpesa.stkQuery(request);
  }

  async sendB2C(params: any) {
    return await this.mpesa.b2c(params);
  }

  async registerC2BUrls(params: any) {
    return await this.mpesa.c2bRegister(params);
  }

  async getAccessToken() {
    return await this.mpesa.getAccessToken();
  }
}

/**
 * MPesa Controller
 * RESTful API endpoints for MPesa operations
 */
@Controller('mpesa')
export class MpesaController {
  constructor(private readonly mpesaService: MpesaService) {}

  @Post('stk-push')
  async initiatePayment(
    @Body() body: {
      amount: number;
      phone: string;
      accountReference: string;
      description?: string;
    }
  ) {
    try {
      const response = await this.mpesaService.initiateSTKPush({
        amount: body.amount,
        phone: body.phone,
        accountReference: body.accountReference,
        transactionDesc: body.description || 'Payment',
      });

      return {
        success: true,
        message: 'STK Push initiated successfully',
        data: response,
      };
    } catch (error: any) {
      return {
        success: false,
        message: error.message,
      };
    }
  }

  @Get('stk-query/:checkoutRequestId')
  async queryPayment(@Param('checkoutRequestId') checkoutRequestId: string) {
    try {
      const response = await this.mpesaService.querySTKPush({
        checkoutRequestId,
      });

      return {
        success: true,
        data: response,
      };
    } catch (error: any) {
      return {
        success: false,
        message: error.message,
      };
    }
  }

  @Post('callback/stk')
  async handleSTKCallback(@Body() body: any) {
    // Process STK Push callback
    const { Body: callbackBody } = body;
    const { stkCallback } = callbackBody;

    if (stkCallback.ResultCode === 0) {
      // Payment successful
      console.log('Payment successful:', stkCallback);
      // TODO: Update your database, send notifications, etc.
    } else {
      // Payment failed
      console.log('Payment failed:', stkCallback.ResultDesc);
    }

    return {
      ResultCode: 0,
      ResultDesc: 'Success',
    };
  }

  @Post('callback/c2b-validation')
  async handleC2BValidation(@Body() body: any) {
    // Validate C2B payment
    console.log('C2B Validation:', body);

    // Perform validation logic
    const isValid = true; // Your validation logic here

    if (isValid) {
      return {
        ResultCode: 0,
        ResultDesc: 'Accepted',
      };
    } else {
      return {
        ResultCode: 'C2B00011',
        ResultDesc: 'Invalid Account Number',
      };
    }
  }

  @Post('callback/c2b-confirmation')
  async handleC2BConfirmation(@Body() body: any) {
    // Process C2B payment confirmation
    console.log('C2B Confirmation:', body);

    // TODO: Save to database, update records, etc.

    return {
      ResultCode: 0,
      ResultDesc: 'Success',
    };
  }
}

/**
 * MPesa Module
 * Import this in your app.module.ts
 */
@Module({
  imports: [],
  controllers: [MpesaController],
  providers: [MpesaService],
  exports: [MpesaService],
})
export class MpesaModule {}

/**
 * Example app.module.ts:
 * 
 * import { Module } from '@nestjs/common';
 * import { ConfigModule } from '@nestjs/config';
 * import { MpesaModule } from './mpesa/mpesa.module';
 * 
 * @Module({
 *   imports: [
 *     ConfigModule.forRoot({
 *       isGlobal: true,
 *     }),
 *     MpesaModule,
 *   ],
 * })
 * export class AppModule {}
 */
