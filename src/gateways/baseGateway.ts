import { GatewayConfig } from '../config/gatewayConfig';

interface PaymentRequest {
    paymentId: string;
    amount: number;
    currency: string;
    metadata?: Record<string, any>;
}

interface RefundRequest {
    paymentId: string;
    transactionId: string;
    amount: number;
    reason?: string;
}

interface GatewayResponse {
    success: boolean;
    transactionId?: string;
    status?: string;
    error?: string;
    response?: Record<string, any>;
}

export abstract class BaseGateway {
    protected config: GatewayConfig;

    constructor(config: GatewayConfig) {
        this.config = config;
    }

    abstract processPayment(request: PaymentRequest): Promise<GatewayResponse>;
    
    abstract refundPayment(request: RefundRequest): Promise<GatewayResponse>;
    
    abstract handleWebhook(payload: any): Promise<GatewayResponse>;

    protected validateCurrency(currency: string): boolean {
        return this.config.supportedCurrencies.includes(currency.toUpperCase());
    }

    protected async retryOperation<T>(
        operation: () => Promise<T>,
        maxAttempts: number = this.config.retryAttempts
    ): Promise<T> {
        let lastError: Error | null = null;
        
        for (let attempt = 1; attempt <= maxAttempts; attempt++) {
            try {
                return await operation();
            } catch (error: unknown) {
                if (error instanceof Error) {
                    lastError = error;
                } else {
                    lastError = new Error(String(error));
                }
                
                if (attempt === maxAttempts) break;
                
                // Exponential backoff
                const delay = Math.min(1000 * Math.pow(2, attempt - 1), 10000);
                await new Promise(resolve => setTimeout(resolve, delay));
            }
        }
        
        throw lastError || new Error('Operation failed after multiple attempts');
    }

    protected createTimeout<T>(
        promise: Promise<T>,
        timeoutMs: number = this.config.timeout
    ): Promise<T> {
        return Promise.race([
            promise,
            new Promise<T>((_, reject) =>
                setTimeout(() => reject(new Error('Operation timed out')), timeoutMs)
            )
        ]);
    }

    protected validateAmount(amount: number): boolean {
        return amount > 0 && Number.isFinite(amount);
    }

    protected formatAmount(amount: number, currency: string): number {
        // Some gateways require amounts in cents/smallest currency unit
        const currenciesInCents = ['USD', 'EUR', 'GBP'];
        return currenciesInCents.includes(currency.toUpperCase()) 
            ? Math.round(amount * 100)
            : amount;
    }
}

export type { PaymentRequest, RefundRequest, GatewayResponse };