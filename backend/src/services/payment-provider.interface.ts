export interface PaymentProvider {
    createOrder(amountInPaise: number, receiptId: string, metadata?: Record<string, string>): Promise<any>;
    verifySignature(orderId: string, paymentId: string, signature: string): boolean;
    refund(transactionId: string, amountInPaise?: number): Promise<any>;
}
