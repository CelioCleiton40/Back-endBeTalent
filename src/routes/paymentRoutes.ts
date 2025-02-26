import { Router } from 'express';
import paymentController from '../controllers/paymentController';
import { authenticate, authorize, webhookAuth } from '../middleware/authMiddleware';

const router = Router();

/**
 * @swagger
 * /api/payments:
 *   post:
 *     summary: Process a new payment
 *     tags: [Payments]
 *     security:
 *       - bearerAuth: []
 */
router.post(
    '/',
    authenticate,
    authorize('admin', 'merchant'),
    paymentController.processPayment
);

/**
 * @swagger
 * /api/payments/{paymentId}:
 *   get:
 *     summary: Get payment status
 *     tags: [Payments]
 *     security:
 *       - bearerAuth: []
 */
router.get(
    '/:paymentId',
    authenticate,
    authorize('admin', 'merchant', 'customer'),
    paymentController.getPaymentStatus
);

/**
 * @swagger
 * /api/payments/{paymentId}/refund:
 *   post:
 *     summary: Refund a payment
 *     tags: [Payments]
 *     security:
 *       - bearerAuth: []
 */
router.post(
    '/:paymentId/refund',
    authenticate,
    authorize('admin', 'merchant'),
    paymentController.refundPayment
);

/**
 * @swagger
 * /api/payments/webhooks/{gateway}:
 *   post:
 *     summary: Handle payment gateway webhooks
 *     tags: [Payments]
 */
router.post(
    '/webhooks/:gateway',
    webhookAuth('stripe'),
    paymentController.handleWebhook
);

/**
 * @swagger
 * /api/payments/order/{orderId}:
 *   get:
 *     summary: Get all payments for an order
 *     tags: [Payments]
 *     security:
 *       - bearerAuth: []
 */
router.get(
    '/order/:orderId',
    authenticate,
    authorize('admin', 'merchant', 'customer'),
    paymentController.getPaymentsByOrder
);

export default router;