import { BaseGateway } from './baseGateway';
import StripeGateway from './gatewayA';
import PayPalGateway from './gatewayB';
import { getActiveGateways } from '../config/gatewayConfig';
import logger from '../utils/logger';

class GatewayManager {
    private static instance: GatewayManager;
    private gateways: Map<string, typeof BaseGateway>;

    private constructor() {
        this.gateways = new Map();
        this.registerDefaultGateways();
    }

    public static getInstance(): GatewayManager {
        if (!GatewayManager.instance) {
            GatewayManager.instance = new GatewayManager();
        }
        return GatewayManager.instance;
    }

    private registerDefaultGateways(): void {
        this.registerGateway('stripe', StripeGateway);
        this.registerGateway('paypal', PayPalGateway);
    }

    public registerGateway(name: string, GatewayClass: typeof BaseGateway): void {
        this.gateways.set(name.toLowerCase(), GatewayClass);
        logger.info(`Payment gateway registered: ${name}`);
    }

    public getGateway(name: string): typeof BaseGateway | undefined {
        return this.gateways.get(name.toLowerCase());
    }

    public getAllRegisteredGateways(): string[] {
        return Array.from(this.gateways.keys());
    }

    public getActiveGatewayInstances(): BaseGateway[] {
        const activeGateways = getActiveGateways();
        return activeGateways
            .map(config => {
                const GatewayClass = this.getGateway(config.name);
                if (!GatewayClass || typeof GatewayClass.prototype.processPayment !== 'function') {
                    logger.warn(`Gateway ${config.name} is configured but implementation not found or invalid`);
                    return null;
                }
                try {
                    // Check if the class is abstract by looking for abstract methods
                    const isAbstract = Object.getOwnPropertyNames(GatewayClass.prototype)
                        .some(prop => {
                            const descriptor = Object.getOwnPropertyDescriptor(GatewayClass.prototype, prop);
                            return descriptor && descriptor.get === undefined && descriptor.value === undefined;
                        });

                    if (isAbstract) {
                        logger.warn(`Gateway ${config.name} is an abstract class and cannot be instantiated`);
                        return null;
                    }
                    
                    // Use type assertion to ensure GatewayClass is a constructable type
                    return new (GatewayClass as new (config: any) => BaseGateway)(config);
                } catch (error) {
                    logger.error(`Failed to instantiate gateway ${config.name}: ${error}`);
                    return null;
                }
            })
            .filter((gateway): gateway is BaseGateway => gateway !== null);
    }

    public isGatewayRegistered(name: string): boolean {
        return this.gateways.has(name.toLowerCase());
    }

    public removeGateway(name: string): boolean {
        const result = this.gateways.delete(name.toLowerCase());
        if (result) {
            logger.info(`Payment gateway removed: ${name}`);
        }
        return result;
    }
}

export const gatewayManager = GatewayManager.getInstance();
export { BaseGateway } from './baseGateway';
export type { PaymentRequest, RefundRequest, GatewayResponse } from './baseGateway';