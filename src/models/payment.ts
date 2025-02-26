import { 
    Entity, 
    PrimaryGeneratedColumn, 
    Column, 
    CreateDateColumn, 
    UpdateDateColumn, 
    ManyToOne, 
    JoinColumn 
} from 'typeorm';
import { Order } from './order';

@Entity('payments')
export class Payment {
    @PrimaryGeneratedColumn('uuid')
    id: string;

    @Column()
    amount: number;

    @Column()
    currency: string;

    @Column()
    gatewayName: string;

    @Column()
    gatewayTransactionId: string;

    @Column({
        type: 'enum',
        enum: ['pending', 'processing', 'completed', 'failed', 'refunded'],
        default: 'pending'
    })
    status: 'pending' | 'processing' | 'completed' | 'failed' | 'refunded';

    @Column({ type: 'jsonb', nullable: true })
    gatewayResponse: Record<string, any>;

    @Column({ nullable: true })
    errorMessage?: string;

    @Column()
    orderId: string;

    @ManyToOne(() => Order, order => order.payments)
    @JoinColumn({ name: 'orderId' })
    order: Order;

    @Column({ type: 'jsonb', nullable: true })
    metadata: Record<string, any>;

    @CreateDateColumn()
    createdAt: Date;

    @UpdateDateColumn()
    updatedAt: Date;

    @Column({ nullable: true })
    refundedAt?: Date;

    @Column({ type: 'decimal', precision: 10, scale: 2, nullable: true })
    refundedAmount?: number;

    @Column({ default: false })
    isTest: boolean;
}