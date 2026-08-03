import { Controller, Post, Body, Req, Headers, BadRequestException } from '@nestjs/common';
import { PaymentsService } from './payments.service';
import Stripe from 'stripe';

@Controller('payments')
export class PaymentsController {
  constructor(private readonly paymentsService: PaymentsService) {}

  @Post('create-intent')
  async createIntent(@Body() body: { candidatureId: number; entrepriseId: number }) {
    if (!body.candidatureId || !body.entrepriseId) {
      throw new BadRequestException('candidatureId et entrepriseId sont requis.');
    }
    return this.paymentsService.créerIntentionPaiement(body.candidatureId, body.entrepriseId);
  }

  @Post('webhook')
  async handleWebhook(
    @Req() req: any,
    @Headers('stripe-signature') signature: string,
  ) {
    const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || '', { apiVersion: '2023-10-16' as any });
    let event: Stripe.Event;

    try {
      // Note: req.rawBody nécessite de configurer NestJS pour conserver le body brut
      event = stripe.webhooks.constructEvent(
        req.rawBody,
        signature,
        process.env.STRIPE_WEBHOOK_SECRET || '',
      );
    } catch (err: any) {
      throw new BadRequestException(`Webhook Error: ${err.message}`);
    }

    if (event.type === 'payment_intent.succeeded') {
      const paymentIntent = event.data.object as Stripe.PaymentIntent;
      await this.paymentsService.validerPaiementReussi(paymentIntent);
    }

    return { received: true };
  }
}