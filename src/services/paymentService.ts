import { AppDataSource } from '../config/database';
import { Payment } from '../models/payment';
import { Order } from '../models/order';
import { getActiveGateways, getGatewayConfig } from '../config/gatewayConfig';
import logger from '../utils/logger';
import { BaseGateway } from '../gateways/baseGateway';

interface PaymentRequest {
    orderId: string;
    amount: number;
    currency: string;
    gatewayName?: string;
}

export class PaymentService {
    private paymentRepository = AppDataSource.getRepository(Payment);
    private orderRepository = AppDataSource.getRepository(Order);

    public async processPayment(request: PaymentRequest): Promise<Payment> {
        const { orderId, amount, currency, gatewayName } = request;
        let gateways = getActiveGateways();

        if (gatewayName) {
            const specificGateway = gateways.find(g => g.name.toLowerCase() === gatewayName.toLowerCase());
            if (!specificGateway) {
                throw new Error(`Gateway ${gatewayName} not found or inactive`);
            }
            gateways = [specificGateway];
        }

        let lastError: Error | null = null;

        for (const gatewayConfig of gateways) {
            try {
                const payment = this.paymentRepository.create({
                    orderId,
                    amount,
                    currency,
                    gatewayName: gatewayConfig.name,
                    status: 'processing'
                });

                await this.paymentRepository.save(payment);

                const GatewayClass = require(`../gateways/${gatewayConfig.name.toLowerCase()}`).default;
                const gateway: BaseGateway = new GatewayClass(gatewayConfig);

                const result = await gateway.processPayment({
                    paymentId: payment.id,
                    amount,
                    currency
                });

                payment.gatewayTransactionId = result.transactionId || '';
                payment.status = result.success ? 'completed' : 'failed';
                payment.gatewayResponse = result.response || {};
                payment.errorMessage = result.error;

                await this.paymentRepository.save(payment);

                if (result.success) {
                    await this.updateOrderStatus(orderId, 'paid');
                    return payment;
                }

                lastError = new Error(result.error || 'Payment failed');
            } catch (error) {
                logger.error(`Payment failed with gateway ${gatewayConfig.name}:`, error);
                lastError = error instanceof Error ? error : new Error(String(error));
            }
        }

        throw lastError || new Error('All payment attempts failed');
    }

    public async refundPayment(payment: Payment, amount: number, reason: string): Promise<Payment> {
        if (payment.status !== 'completed') {
            throw new Error('Can only refund completed payments');
        }

        const gatewayConfig = getGatewayConfig(payment.gatewayName);
        if (!gatewayConfig) {
            throw new Error('Gateway configuration not found');
        }

        const GatewayClass = require(`../gateways/${payment.gatewayName.toLowerCase()}`).default;
        const gateway: BaseGateway = new GatewayClass(gatewayConfig);

        const refundResult = await gateway.refundPayment({
            paymentId: payment.id,
            transactionId: payment.gatewayTransactionId,
            amount,
            reason
        });

        if (refundResult.success) {
            payment.status = 'refunded';
            payment.refundedAmount = amount;
            payment.refundedAt = new Date();
            payment.gatewayResponse = {
                ...payment.gatewayResponse,
                refund: refundResult.response
            };

            await this.paymentRepository.save(payment);
        } else {
            throw new Error(refundResult.error || 'Refund failed');
        }

        return payment;
    }

    public async handleWebhook(gateway: string, payload: any): Promise<void> {
        const gatewayConfig = getGatewayConfig(gateway);
        if (!gatewayConfig) {
            throw new Error('Gateway configuration not found');
        }

        const GatewayClass = require(`../gateways/${gateway.toLowerCase()}`).default;
        const gatewayInstance: BaseGateway = new GatewayClass(gatewayConfig);

        const webhookData = await gatewayInstance.handleWebhook(payload);
        if (!webhookData.success) {
            throw new Error(webhookData.error || 'Webhook processing failed');
        }

        const payment = await this.paymentRepository.findOne({
            where: { gatewayTransactionId: webhookData.transactionId }
        });

        if (payment) {
            // Ensure status is one of the valid payment status types
            const validStatus = webhookData.status as "processing" | "pending" | "completed" | "failed" | "refunded";
            payment.status = validStatus;
            payment.gatewayResponse = {
                ...payment.gatewayResponse,
                webhook: webhookData.response
            };

            await this.paymentRepository.save(payment);

            if (validStatus === 'completed') {
                await this.updateOrderStatus(payment.orderId, 'paid');
            }
        }
    }

    private async updateOrderStatus(orderId: string, status: "processing" | "pending" | "failed" | "paid" | "cancelled"): Promise<void> {
        const order = await this.orderRepository.findOne({
            where: { id: orderId }
        });

        if (order) {
            order.status = status;
            order.paidAt = status === 'paid' ? new Date() : undefined;
            await this.orderRepository.save(order);
        }
    }
}

export default PaymentService;