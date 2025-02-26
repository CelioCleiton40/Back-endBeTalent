import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { env } from '../config/dotenv';
import logger from '../utils/logger';

interface AuthenticatedRequest extends Request {
    user?: {
        id: string;
        role: string;
    };
}

export const authenticate = async (
    req: AuthenticatedRequest,
    res: Response,
    next: NextFunction
): Promise<void> => { // Retorna void em vez de Response
    try {
        const authHeader = req.headers.authorization;

        if (!authHeader || !authHeader.startsWith('Bearer ')) {
            res.status(401).json({
                error: 'Authentication required'
            });
            return;
        }

        const token = authHeader.split(' ')[1];

        try {
            const decoded = jwt.verify(token, env.jwt.secret) as {
                id: string;
                role: string;
            };

            req.user = decoded;
            next();
        } catch (error) {
            logger.error('Token verification failed:', error);
            res.status(401).json({
                error: 'Invalid or expired token'
            });
            return;
        }
    } catch (error) {
        logger.error('Authentication middleware error:', error);
        res.status(500).json({
            error: 'Authentication failed'
        });
    }
};

export const authorize = (...allowedRoles: string[]) => {
    return (req: AuthenticatedRequest, res: Response, next: NextFunction): void => { // Alterado para void
        if (!req.user) {
            res.status(401).json({
                error: 'Authentication required'
            });
            return;
        }

        if (!allowedRoles.includes(req.user.role)) {
            res.status(403).json({
                error: 'Insufficient permissions'
            });
            return;
        }

        next(); // Passa para o próximo middleware ou controlador
    };
};

export const apiKeyAuth = (
    req: Request,
    res: Response,
    next: NextFunction
) => {
    const apiKey = req.headers['x-api-key'];

    if (!apiKey || apiKey !== env.apiKey) {
        logger.warn('Invalid API key attempt:', {
            ip: req.ip,
            path: req.path
        });
        
        return res.status(401).json({
            error: 'Invalid API key'
        });
    }

    next();
};

export const webhookAuth = (gatewayName: string) => {
    return (req: Request, res: Response, next: NextFunction): void => {
        const signature = req.headers['webhook-signature'];

        if (!signature) {
            logger.warn(`Missing webhook signature for ${gatewayName}`);
            res.status(401).json({ error: 'Missing webhook signature' });
            return; // <-- Adiciona return aqui para evitar execução de next()
        }

        // Store raw body for webhook signature verification
        (req as any).rawBody = Buffer.from(JSON.stringify(req.body));

        next(); // Apenas chama next() sem retornar nada
    };
};
