import {
  userRepository,
  orderRepository,
  paymentRepository,
  IUserRepository,
  IOrderRepository,
  IPaymentRepository,
} from "@/repositories";

export class ServiceContainer {
  private static instance: ServiceContainer;

  public readonly userRepository: IUserRepository;
  public readonly orderRepository: IOrderRepository;
  public readonly paymentRepository: IPaymentRepository;

  private constructor() {
    this.userRepository = userRepository;
    this.orderRepository = orderRepository;
    this.paymentRepository = paymentRepository;
  }

  public static getInstance(): ServiceContainer {
    if (!ServiceContainer.instance) {
      ServiceContainer.instance = new ServiceContainer();
    }
    return ServiceContainer.instance;
  }
}

export const container = ServiceContainer.getInstance();
