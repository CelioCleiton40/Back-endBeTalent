import dotenv from 'dotenv';
import path from 'path';
import logger from '../utils/logger';

// Interface para as variáveis de ambiente
export interface StripeConfig {
    secretKey: string;
    webhookSecret: string;
}

export interface PayPalConfig {
    clientId: string;
    clientSecret: string;
    mode: string;
}

export interface Env {
    database: {
        host: string;
        port: number;
        username: string;
        password: string;
        name: string;
    };
    server: {
        port: number;
        nodeEnv: string;
    };
    jwt: {
        secret: string;
        expiresIn: string;
    };
    apiKey: string;
    stripe: StripeConfig;
    paypal: PayPalConfig;
}

// Carregar as variáveis de ambiente do arquivo .env
const result = dotenv.config({
    path: path.join(__dirname, '../../.env')
});

if (result.error) {
    logger.error('Error loading .env file:', result.error);
    throw result.error;
}

// Variáveis de ambiente obrigatórias
const requiredEnvVars = [
    'DB_HOST',
    'DB_PORT',
    'DB_USERNAME',
    'DB_PASSWORD',
    'DB_NAME',
    'PORT',
    'NODE_ENV',
    'JWT_SECRET'
];

// Variáveis de ambiente específicas de gateway
const gatewayEnvVars = {
    STRIPE: ['STRIPE_SECRET_KEY', 'STRIPE_WEBHOOK_SECRET'],
    PAYPAL: ['PAYPAL_CLIENT_ID', 'PAYPAL_CLIENT_SECRET'],
};

// Validar as variáveis de ambiente obrigatórias
const missingVars = requiredEnvVars.filter(envVar => !process.env[envVar]);

if (missingVars.length > 0) {
    const error = `Missing required environment variables: ${missingVars.join(', ')}`;
    logger.error(error);
    throw new Error(error);
}

// Verificar se as variáveis de ambiente do Stripe estão presentes
if (gatewayEnvVars.STRIPE.some(key => !process.env[key])) {
    logger.error('Missing Stripe gateway environment variables.');
    throw new Error('Missing Stripe gateway environment variables.');
}

// Verificar se as variáveis de ambiente do PayPal estão presentes
if (gatewayEnvVars.PAYPAL.some(key => !process.env[key])) {
    logger.error('Missing PayPal gateway environment variables.');
    throw new Error('Missing PayPal gateway environment variables.');
}

// Exportar variáveis de ambiente com tipagem
export const env: Env = {
    database: {
        host: process.env.DB_HOST!,
        port: parseInt(process.env.DB_PORT!, 10),
        username: process.env.DB_USERNAME!,
        password: process.env.DB_PASSWORD!,
        name: process.env.DB_NAME!
    },
    server: {
        port: parseInt(process.env.PORT!, 10),
        nodeEnv: process.env.NODE_ENV!
    },
    jwt: {
        secret: process.env.JWT_SECRET!,
        expiresIn: process.env.JWT_EXPIRES_IN || '24h'
    },
    apiKey: process.env.API_KEY!,
    stripe: {
        secretKey: process.env.STRIPE_SECRET_KEY!,
        webhookSecret: process.env.STRIPE_WEBHOOK_SECRET!
    },
    paypal: {
        clientId: process.env.PAYPAL_CLIENT_ID!,
        clientSecret: process.env.PAYPAL_CLIENT_SECRET!,
        mode: process.env.PAYPAL_MODE || 'sandbox'
    }
};

export default env;
