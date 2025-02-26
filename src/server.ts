import app from './app';
import { env } from './config/dotenv';
import { initializeDatabase } from './config/database';
import logger from './utils/logger';

const startServer = async () => {
    try {
        // Initialize database connection
        await initializeDatabase();

        const port = env.server.port || 3000;
        
        app.listen(port, () => {
            logger.info(`Server is running on port ${port}`);
            logger.info(`Environment: ${env.server.nodeEnv}`);
        });

    } catch (error) {
        logger.error('Failed to start server:', error);
        process.exit(1);
    }
};

// Handle uncaught exceptions
process.on('uncaughtException', (error) => {
    logger.error('Uncaught Exception:', error);
    process.exit(1);
});

// Handle unhandled promise rejections
process.on('unhandledRejection', (reason, promise) => {
    logger.error('Unhandled Rejection at:', promise, 'reason:', reason);
    process.exit(1);
});

startServer();