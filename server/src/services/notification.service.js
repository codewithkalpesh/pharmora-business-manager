// src/services/notification.service.js
const prisma = require('../config/prisma');
const ApiError = require('../utils/ApiError');

class NotificationService {
  /**
   * Get paginated notifications for a user
   */
  async getNotifications(userId, query) {
    // Auto-generate 5-day advance recurring reminders for user
    await this.generateUpcomingReminders(userId);

    const page = parseInt(query.page, 10) || 1;
    const limit = parseInt(query.limit, 10) || 30;
    const skip = (page - 1) * limit;

    const where = { userId };
    if (query.status) where.status = query.status;

    const [notifications, total, unreadCount] = await Promise.all([
      prisma.notification.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
      prisma.notification.count({ where }),
      prisma.notification.count({ where: { userId, status: 'UNREAD' } }),
    ]);

    return {
      notifications,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
      unreadCount,
    };
  }

  /**
   * Get unread count for a user
   */
  async getUnreadCount(userId) {
    await this.generateUpcomingReminders(userId);
    return prisma.notification.count({ where: { userId, status: 'UNREAD' } });
  }

  /**
   * Mark a single notification as read
   */
  async markAsRead(id, userId) {
    const notif = await prisma.notification.findFirst({ where: { id, userId } });
    if (!notif) throw new ApiError(404, 'Notification not found.');
    return prisma.notification.update({ where: { id }, data: { status: 'READ' } });
  }

  /**
   * Mark all unread notifications as read for a user
   */
  async markAllAsRead(userId) {
    const result = await prisma.notification.updateMany({
      where: { userId, status: 'UNREAD' },
      data: { status: 'READ' },
    });
    return result;
  }

  /**
   * Dismiss a notification
   */
  async dismiss(id, userId) {
    const notif = await prisma.notification.findFirst({ where: { id, userId } });
    if (!notif) throw new ApiError(404, 'Notification not found.');
    return prisma.notification.update({ where: { id }, data: { status: 'DISMISSED' } });
  }

  /**
   * Delete a notification
   */
  async deleteNotification(id, userId) {
    const notif = await prisma.notification.findFirst({ where: { id, userId } });
    if (!notif) throw new ApiError(404, 'Notification not found.');
    return prisma.notification.delete({ where: { id } });
  }

  /**
   * Create a notification (internal use)
   */
  async createNotification({ userId, title, message, type = 'INFO', link = null }) {
    return prisma.notification.create({
      data: { userId, title, message, type, link, status: 'UNREAD' },
    });
  }

  /**
   * Auto-generate notifications for upcoming recurring transactions (next 5 days)
   */
  async generateUpcomingReminders(userId) {
    if (!userId) return [];
    const threshold = new Date();
    threshold.setDate(threshold.getDate() + 5);

    const upcoming = await prisma.recurringTransaction.findMany({
      where: {
        isActive: true,
        createdById: userId,
        nextDueDate: { lte: threshold },
      },
      take: 20,
    });

    const created = [];
    for (const tx of upcoming) {
      const today = new Date();
      today.setHours(0, 0, 0, 0);

      const exists = await prisma.notification.findFirst({
        where: {
          userId,
          title: { contains: tx.title },
          createdAt: { gte: today },
        },
      });

      if (!exists) {
        const daysLeft = Math.ceil((new Date(tx.nextDueDate) - Date.now()) / 86400000);
        const urgency = daysLeft <= 0 ? 'OVERDUE' : daysLeft === 1 ? 'DUE TOMORROW' : `DUE IN ${daysLeft} DAYS`;
        const notif = await this.createNotification({
          userId,
          title: `${urgency}: ${tx.title}`,
          message: `₹${Number(tx.amount).toLocaleString('en-IN')} — ${tx.frequency} recurring ${tx.type.toLowerCase()} (Due: ${new Date(tx.nextDueDate).toLocaleDateString('en-IN')})`,
          type: daysLeft <= 0 ? 'ERROR' : daysLeft <= 1 ? 'WARNING' : 'INFO',
          link: '/recurring',
        });
        created.push(notif);
      }
    }

    return created;
  }
}

module.exports = new NotificationService();
