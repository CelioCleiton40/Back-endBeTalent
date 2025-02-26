import { Request, Response } from 'express';
import { PaymentService } from '../services/paymentService';
import logger from '../utils/logger';
import { AppDataSource } from '../config/database';
import { Payment } from '../models/payment';
import { Order } from '../models/order';

export class PaymentController {
    private paymentService: PaymentService;
    private paymentRepository = AppDataSource.getRepository(Payment);
    private orderRepository = AppDataSource.getRepository(Order);

    constructor() {
        this.paymentService = new PaymentService();
    }

    public processPayment = async (req: Request, res: Response): Promise<void> => {
        try {
            const { orderId, gatewayName } = req.body;

            const order = await this.orderRepository.findOne({
                where: { id: orderId }
            });

            if (!order) {
                res.status(404).json({ error: 'Order not found' });
                return;
            }

            const payment = await this.paymentService.processPayment({
                orderId,
                amount: order.totalAmount,
                currency: order.currency,
                gatewayName
            });

            res.status(200).json(payment);
        } catch (error) {
            logger.error('Payment processing failed:', error);
            res.status(500).json({ error: 'Payment processing failed' });
        }
    };

    public getPaymentStatus = async (req: Request, res: Response): Promise<void> => {
        try {
            const { paymentId } = req.params;

            const payment = await this.paymentRepository.findOne({
                where: { id: paymentId },
                relations: ['order']
            });

            if (!payment) {
                res.status(404).json({ error: 'Payment not found' });
                return;
            }

            res.status(200).json(payment);
        } catch (error) {
            logger.error('Error fetching payment status:', error);
            res.status(500).json({ error: 'Error fetching payment status' });
        }
    };

    public refundPayment = async (req: Request, res: Response): Promise<void> => {
        try {
            const { paymentId } = req.params;
            const { amount, reason } = req.body;

            const payment = await this.paymentRepository.findOne({
                where: { id: paymentId }
            });

            if (!payment) {
                res.status(404).json({ error: 'Payment not found' });
                return;
            }

            const refund = await this.paymentService.refundPayment(payment, amount, reason);
            res.status(200).json(refund);
        } catch (error) {
            logger.error('Refund processing failed:', error);
            res.status(500).json({ error: 'Refund processing failed' });
        }
    };

    public handleWebhook = async (req: Request, res: Response): Promise<void> => {
        try {
            const { gateway } = req.params;
            const payload = req.body;

            await this.paymentService.handleWebhook(gateway, payload);
            res.status(200).json({ received: true });
        } catch (error) {
            logger.error('Webhook processing failed:', error);
            res.status(500).json({ error: 'Webhook processing failed' });
        }
    };

    public getPaymentsByOrder = async (req: Request, res: Response): Promise<void> => {
        try {
            const { orderId } = req.params;

            const payments = await this.paymentRepository.find({
                where: { orderId },
                order: { createdAt: 'DESC' }
            });

            res.status(200).json(payments);
        } catch (error) {
            logger.error('Error fetching order payments:', error);
            res.status(500).json({ error: 'Error fetching order payments' });
        }
    };
}

export default new PaymentController();
