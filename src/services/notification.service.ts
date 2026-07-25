import { prisma } from "@/lib/prisma";
import { NotificationPageDTO, NotificationItemDTO } from "@/dto";

export async function getNotificationDTO(
  userId: string,
  page: number = 1,
  limit: number = 20
): Promise<NotificationPageDTO> {
  const skip = (page - 1) * limit;

  const [notifications, totalCount, unreadCount, systemCount, orderCount, paymentCount] =
    await Promise.all([
      prisma.notification.findMany({
        where: { userId },
        orderBy: { createdAt: "desc" },
        skip,
        take: limit,
      }),
      prisma.notification.count({ where: { userId } }),
      prisma.notification.count({ where: { userId, isRead: false } }),
      prisma.notification.count({ where: { userId, type: "SYSTEM" } }),
      prisma.notification.count({ where: { userId, type: "ORDER" } }),
      prisma.notification.count({ where: { userId, type: "PAYMENT" } }),
    ]);

  const items: NotificationItemDTO[] = notifications.map((n) => ({
    id: n.id,
    title: n.title,
    message: n.message,
    type: n.type as any,
    read: n.isRead,
    createdAt: n.createdAt.toISOString(),
  }));

  const totalPages = Math.ceil(totalCount / limit) || 1;

  return {
    notifications: items,
    unreadCount,
    totalCount,
    categories: {
      system: systemCount,
      order: orderCount,
      payment: paymentCount,
      delivery: 0,
    },
    pagination: {
      page,
      limit,
      totalPages,
      hasNext: page < totalPages,
    },
  };
}

export async function markNotificationAsRead(userId: string, notificationId: string) {
  return await prisma.notification.updateMany({
    where: { id: notificationId, userId },
    data: { isRead: true, readAt: new Date() },
  });
}

export async function markAllNotificationsAsRead(userId: string) {
  return await prisma.notification.updateMany({
    where: { userId, isRead: false },
    data: { isRead: true, readAt: new Date() },
  });
}
