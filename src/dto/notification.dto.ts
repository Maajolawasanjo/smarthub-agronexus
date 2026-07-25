export interface NotificationItemDTO {
  id: string;
  title: string;
  message: string;
  type: "SYSTEM" | "ORDER" | "PAYMENT" | "DELIVERY";
  read: boolean;
  createdAt: string;
}

export interface NotificationPageDTO {
  notifications: NotificationItemDTO[];
  unreadCount: number;
  totalCount: number;
  categories: {
    system: number;
    order: number;
    payment: number;
    delivery: number;
  };
  pagination: {
    page: number;
    limit: number;
    totalPages: number;
    hasNext: boolean;
  };
}
