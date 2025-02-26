import { env } from './dotenv';
import logger from '../utils/logger';

export interface GatewayConfig {
    name: string;
    isActive: boolean;
    priority: number;
    credentials: Record<string, string>;
    apiEndpoint: string;
    webhookEndpoint?: string;
    supportedCurrencies: string[];
    retryAttempts: number;
    timeout: number;
}

const gatewayConfigs: Record<string, GatewayConfig> = {
    stripe: {
        name: 'Stripe',
        isActive: !!env.stripe.secretKey,
        priority: 1,
        credentials: {
            secretKey: env.stripe.secretKey || '',
            webhookSecret: env.stripe.webhookSecret || ''
        },
        apiEndpoint: 'https://api.stripe.com/v1',
        webhookEndpoint: '/webhooks/stripe',
        supportedCurrencies: ['USD', 'EUR', 'GBP', 'BRL'],
        retryAttempts: 3,
        timeout: 30000
    },
    paypal: {
        name: 'PayPal',
        isActive: !!env.paypal.clientId,
        priority: 2,
        credentials: {
            clientId: env.paypal.clientId || '',
            clientSecret: env.paypal.clientSecret || ''
        },
        apiEndpoint: env.paypal.mode === 'sandbox' 
            ? 'https://api.sandbox.paypal.com'
            : 'https://api.paypal.com',
        webhookEndpoint: '/webhooks/paypal',
        supportedCurrencies: ['USD', 'EUR', 'GBP', 'BRL'],
        retryAttempts: 3,
        timeout: 30000
    }
};

export const getActiveGateways = (): GatewayConfig[] => {
    const activeGateways = Object.values(gatewayConfigs)
        .filter(gateway => gateway.isActive)
        .sort((a, b) => a.priority - b.priority);

    logger.info(`Active payment gateways: ${activeGateways.map(g => g.name).join(', ')}`);
    return activeGateways;
};

export const getGatewayConfig = (gatewayName: string): GatewayConfig | undefined => {
    const config = gatewayConfigs[gatewayName.toLowerCase()];
    
    if (!config) {
        logger.warn(`Gateway configuration not found for: ${gatewayName}`);
        return undefined;
    }

    return config;
};

export const validateGatewayConfig = (config: GatewayConfig): boolean => {
    const requiredFields = ['name', 'credentials', 'apiEndpoint'];
    const isValid = requiredFields.every(field => !!config[field]);

    if (!isValid) {
        logger.error(`Invalid gateway configuration for: ${config.name}`);
    }

    return isValid;
};

export default gatewayConfigs;