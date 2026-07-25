export interface IOrderRepository {
  findById(id: string): Promise<any>;
  findLatestByBuyer(buyerId: string): Promise<any>;
  updateStatus(id: string, status: string): Promise<any>;
}
