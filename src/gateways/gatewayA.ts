import Stripe from 'stripe';
import { BaseGateway, PaymentRequest, RefundRequest, GatewayResponse } from './baseGateway';
import logger from '../utils/logger';

class StripeGateway extends BaseGateway {
    private stripe: Stripe;

    constructor(config: any) {
        super(config);
        this.stripe = new Stripe(config.credentials.secretKey, {
            apiVersion: '2025-02-24.acacia'
        });
    }

    public async processPayment(request: PaymentRequest): Promise<GatewayResponse> {
        if (!this.validateCurrency(request.currency)) {
            return {
                success: false,
                error: `Currency ${request.currency} not supported`
            };
        }

        if (!this.validateAmount(request.amount)) {
            return {
                success: false,
                error: 'Invalid amount'
            };
        }

        try {
            const amount = this.formatAmount(request.amount, request.currency);

            const paymentIntent = await this.createTimeout(
                this.stripe.paymentIntents.create({
                    amount,
                    currency: request.currency.toLowerCase(),
                    metadata: {
                        paymentId: request.paymentId,
                        ...request.metadata
                    },
                    confirm: true,
                    automatic_payment_methods: {
                        enabled: true,
                        allow_redirects: 'never'
                    }
                })
            );

            return {
                success: paymentIntent.status === 'succeeded',
                transactionId: paymentIntent.id,
                status: paymentIntent.status,
                response: paymentIntent
            };
        } catch (error) {
            logger.error('Stripe payment processing error:', error);
            return {
                success: false,
                error: error instanceof Error ? error.message : 'Payment processing failed'
            };
        }
    }

    public async refundPayment(request: RefundRequest): Promise<GatewayResponse> {
        try {
            const refund = await this.createTimeout(
                this.stripe.refunds.create({
                    payment_intent: request.transactionId,
                    amount: this.formatAmount(request.amount, 'USD'),
                    reason: request.reason as Stripe.RefundCreateParams.Reason || 'requested_by_customer',
                    metadata: {
                        paymentId: request.paymentId
                    }
                })
            );

            return {
                success: refund.status === 'succeeded',
                transactionId: refund.id,
                status: refund.status || undefined,
                response: refund
            };
        } catch (error) {
            logger.error('Stripe refund processing error:', error);
            return {
                success: false,
                error: error instanceof Error ? error.message : 'Refund processing failed'
            };
        }
    }

    public async handleWebhook(payload: any): Promise<GatewayResponse> {
        try {
            const event = this.stripe.webhooks.constructEvent(
                payload.body,
                payload.headers['stripe-signature'],
                this.config.credentials.webhookSecret
            );

            let status: string;
            switch (event.type) {
                case 'payment_intent.succeeded':
                    status = 'completed';
                    break;
                case 'payment_intent.payment_failed':
                    status = 'failed';
                    break;
                default:
                    status = 'processing';
            }

            return {
                success: true,
                transactionId: (event.data.object as any).id,
                status,
                response: event.data.object
            };
        } catch (error) {
            logger.error('Stripe webhook processing error:', error);
            return {
                success: false,
                error: error instanceof Error ? error.message : 'Webhook processing failed'
            };
        }
    }
}

export default StripeGateway;