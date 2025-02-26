import { DataSource } from 'typeorm';
import { Payment } from '../models/payment';
import { Order } from '../models/order';
import logger from '../utils/logger';

export const AppDataSource = new DataSource({
    type: 'postgres',
    host: process.env.DB_HOST || 'localhost',
    port: parseInt(process.env.DB_PORT || '5432'),
    username: process.env.DB_USERNAME || 'postgres',
    password: process.env.DB_PASSWORD || 'postgres',
    database: process.env.DB_NAME || 'payment_gateway',
    entities: [Payment, Order],
    synchronize: process.env.NODE_ENV !== 'production',
    logging: process.env.NODE_ENV !== 'production',
    logger: {
        log: (level, message) => {
            logger.info(message);
        },
        logQuery: (query) => {
            logger.debug('Query executed:', { query });
        },
        logQueryError: (error, query) => {
            logger.error('Database query failed:', { error, query });
        },
        logQuerySlow: (time, query) => {
            logger.warn('Slow query detected:', { time, query });
        },
        logMigration: (message) => {
            logger.info('Migration:', message);
        },
        logSchemaBuild: (message) => {
            logger.info('Schema:', message);
        },
    }
});

export const initializeDatabase = async () => {
    try {
        await AppDataSource.initialize();
        logger.info('Database connection established successfully');
    } catch (error) {
        logger.error('Error during database initialization:', error);
        throw error;
    }
};

export default AppDataSource;