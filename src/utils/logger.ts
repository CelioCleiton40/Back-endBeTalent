import winston from 'winston';
import path from 'path';

const logger = winston.createLogger({
  level: 'info',
  format: winston.format.combine(
    winston.format.timestamp({
      format: 'YYYY-MM-DD HH:mm:ss'
    }),
    winston.format.errors({ stack: true }),
    winston.format.splat(),
    winston.format.json()
  ),
  defaultMeta: { service: 'payment-gateway-api' },
  transports: [
    // Write all logs with level 'error' and below to 'error.log'
    new winston.transports.File({
      filename: path.join(__dirname, '../../logs/error.log'),
      level: 'error'
    }),
    // Write all logs with level 'info' and below to 'combined.log'
    new winston.transports.File({
      filename: path.join(__dirname, '../../logs/combined.log')
    })
  ]
});

// If we're not in production, log to the console as well
if (process.env.NODE_ENV !== 'production') {
  logger.add(new winston.transports.Console({
    format: winston.format.combine(
      winston.format.colorize(),
      winston.format.simple()
    )
  }));
}

export const logPaymentAttempt = (
  orderId: string,
  gatewayName: string,
  amount: number,
  status: 'success' | 'failed'
) => {
  logger.info('Payment attempt', {
    orderId,
    gatewayName,
    amount,
    status,
    timestamp: new Date().toISOString()
  });
};

export const logError = (
  error: Error,
  context: {
    orderId?: string;
    gatewayName?: string;
    operation: string;
  }
) => {
  logger.error('Operation failed', {
    error: error.message,
    stack: error.stack,
    ...context,
    timestamp: new Date().toISOString()
  });
};

export default logger;