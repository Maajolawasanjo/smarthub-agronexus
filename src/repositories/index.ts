export * from "./interfaces/IUserRepository";
export * from "./interfaces/IOrderRepository";
export * from "./interfaces/IPaymentRepository";

import { PrismaUserRepository } from "./implementations/PrismaUserRepository";
import { PrismaOrderRepository } from "./implementations/PrismaOrderRepository";
import { PrismaPaymentRepository } from "./implementations/PrismaPaymentRepository";

export const userRepository = new PrismaUserRepository();
export const orderRepository = new PrismaOrderRepository();
export const paymentRepository = new PrismaPaymentRepository();
