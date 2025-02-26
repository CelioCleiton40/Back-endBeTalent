import {
    Entity,
    PrimaryGeneratedColumn,
    Column,
    CreateDateColumn,
    UpdateDateColumn,
    OneToMany
} from 'typeorm';
import { Payment } from './payment';

@Entity('orders')
export class Order {
    @PrimaryGeneratedColumn('uuid')
    id: string;

    @Column()
    customerId: string;

    @Column()
    customerEmail: string;

    @Column({ type: 'decimal', precision: 10, scale: 2 })
    totalAmount: number;

    @Column()
    currency: string;

    @Column({
        type: 'enum',
        enum: ['pending', 'processing', 'paid', 'failed', 'cancelled'],
        default: 'pending'
    })
    status: 'pending' | 'processing' | 'paid' | 'failed' | 'cancelled';

    @Column({ type: 'jsonb' })
    items: {
        id: string;
        name: string;
        quantity: number;
        unitPrice: number;
        subtotal: number;
    }[];

    @OneToMany(() => Payment, payment => payment.order)
    payments: Payment[];

    @Column({ type: 'jsonb', nullable: true })
    billingAddress: {
        street: string;
        city: string;
        state: string;
        country: string;
        postalCode: string;
    };

    @Column({ type: 'jsonb', nullable: true })
    metadata: Record<string, any>;

    @CreateDateColumn()
    createdAt: Date;

    @UpdateDateColumn()
    updatedAt: Date;

    @Column({ nullable: true })
    paidAt?: Date;

    @Column({ default: false })
    isTest: boolean;

    calculateTotal(): number {
        return this.items.reduce((sum, item) => 
            sum + (item.quantity * item.unitPrice), 0);
    }

    validateOrder(): boolean {
        const calculatedTotal = this.calculateTotal();
        return Math.abs(calculatedTotal - Number(this.totalAmount)) < 0.01;
    }
}