import axios from 'axios';
import { BaseGateway, PaymentRequest, RefundRequest, GatewayResponse } from './baseGateway';
import logger from '../utils/logger';

class PayPalGateway extends BaseGateway {
    private accessToken: string | null = null;
    private tokenExpiration: Date | null = null;

    private async getAccessToken(): Promise<string> {
        if (this.accessToken && this.tokenExpiration && this.tokenExpiration > new Date()) {
            return this.accessToken;
        }

        try {
            const auth = Buffer.from(
                `${this.config.credentials.clientId}:${this.config.credentials.clientSecret}`
            ).toString('base64');

            const response = await axios.post(
                `${this.config.apiEndpoint}/v1/oauth2/token`,
                'grant_type=client_credentials',
                {
                    headers: {
                        'Authorization': `Basic ${auth}`,
                        'Content-Type': 'application/x-www-form-urlencoded'
                    }
                }
            );

            this.accessToken = (response.data as { access_token: string }).access_token;
            this.tokenExpiration = new Date(Date.now() + ((response.data as { expires_in: number }).expires_in * 1000));
            return this.accessToken;
        } catch (error) {
            logger.error('PayPal authentication error:', error);
            throw new Error('Failed to authenticate with PayPal');
        }
    }

    public async processPayment(request: PaymentRequest): Promise<GatewayResponse> {
        if (!this.validateCurrency(request.currency)) {
            return {
                success: false,
                error: `Currency ${request.currency} not supported`
            };
        }

        try {
            const accessToken = await this.getAccessToken();
            const amount = this.formatAmount(request.amount, request.currency);

            const paymentData = {
                intent: 'CAPTURE',
                purchase_units: [{
                    amount: {
                        currency_code: request.currency.toUpperCase(),
                        value: (amount / 100).toFixed(2)
                    },
                    reference_id: request.paymentId
                }]
            };

            const response = await this.createTimeout(
Promise.resolve(axios.post(
    `${this.config.apiEndpoint}/v2/checkout/orders`,
    paymentData,
    {
        headers: {
            'Authorization': `Bearer ${accessToken}`,
            'Content-Type': 'application/json'
        }
    }
))
            );

            const captureResponse = await axios.post(
                `${this.config.apiEndpoint}/v2/checkout/orders/${(response.data as { id: string }).id}/capture`,
                {},
                {
                    headers: {
                        'Authorization': `Bearer ${accessToken}`,
                        'Content-Type': 'application/json'
                    }
                }
            );

            return {
                success: (captureResponse.data as { status: string }).status === 'COMPLETED',
                transactionId: (captureResponse.data as { id: string }).id,
                status: ((captureResponse.data as { status: string }).status).toLowerCase(),
                response: captureResponse.data as Record<string, any>
            };
        } catch (error) {
            logger.error('PayPal payment processing error:', error);
            return {
                success: false,
                error: error instanceof Error ? error.message : 'Payment processing failed'
            };
        }
    }

    public async refundPayment(request: RefundRequest): Promise<GatewayResponse> {
        try {
            const accessToken = await this.getAccessToken();
            const amount = this.formatAmount(request.amount, 'USD');

            const refundData = {
                amount: {
                    currency_code: 'USD',
                    value: (amount / 100).toFixed(2)
                },
                note_to_payer: request.reason
            };

            const response = await this.createTimeout(
Promise.resolve(axios.post(
    `${this.config.apiEndpoint}/v2/payments/captures/${request.transactionId}/refund`,
    refundData,
    {
        headers: {
            'Authorization': `Bearer ${accessToken}`,
            'Content-Type': 'application/json'
        }
    }
))
            );

            return {
                success: (response.data as { status: string }).status === 'COMPLETED',
                transactionId: (response.data as { id: string }).id,
                status: ((response.data as { status: string }).status).toLowerCase(),
                response: response.data as Record<string, any>
            };
        } catch (error) {
            logger.error('PayPal refund processing error:', error);
            return {
                success: false,
                error: error instanceof Error ? error.message : 'Refund processing failed'
            };
        }
    }

    public async handleWebhook(payload: any): Promise<GatewayResponse> {
        try {
            // Verify webhook signature if available
            const webhookEvent = payload;
            const eventType = webhookEvent.event_type;

            let status: string;
            switch (eventType) {
                case 'PAYMENT.CAPTURE.COMPLETED':
                    status = 'completed';
                    break;
                case 'PAYMENT.CAPTURE.DENIED':
                    status = 'failed';
                    break;
                default:
                    status = 'processing';
            }

            return {
                success: true,
                transactionId: webhookEvent.resource.id,
                status,
                response: webhookEvent
            };
        } catch (error) {
            logger.error('PayPal webhook processing error:', error);
            return {
                success: false,
                error: error instanceof Error ? error.message : 'Webhook processing failed'
            };
        }
    }
}

export default PayPalGateway;