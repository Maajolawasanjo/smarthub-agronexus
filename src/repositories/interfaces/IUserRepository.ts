export interface IUserRepository {
  findById(id: string): Promise<any>;
  findByEmail(email: string): Promise<any>;
  findFarmerProfileByUserId(userId: string): Promise<any>;
  findBuyerProfileByUserId(userId: string): Promise<any>;
}
