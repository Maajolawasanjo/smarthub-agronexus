export interface IPaymentRepository {
  findByTransactionRef(transactionRef: string): Promise<any>;
  findByOrderId(orderId: string): Promise<any>;
}
