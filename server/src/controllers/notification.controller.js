// src/controllers/notification.controller.js
const notificationService = require('../services/notification.service');
const ApiResponse = require('../utils/ApiResponse');

class NotificationController {
  async getNotifications(req, res, next) {
    try {
      const data = await notificationService.getNotifications(req.user.id, req.query);
      return res.status(200).json(new ApiResponse(200, data, 'Notifications retrieved successfully.'));
    } catch (error) {
      next(error);
    }
  }

  async getUnreadCount(req, res, next) {
    try {
      const count = await notificationService.getUnreadCount(req.user.id);
      return res.status(200).json(new ApiResponse(200, { count }, 'Unread count retrieved.'));
    } catch (error) {
      next(error);
    }
  }

  async markAsRead(req, res, next) {
    try {
      const notif = await notificationService.markAsRead(req.params.id, req.user.id);
      return res.status(200).json(new ApiResponse(200, notif, 'Notification marked as read.'));
    } catch (error) {
      next(error);
    }
  }

  async markAllAsRead(req, res, next) {
    try {
      const result = await notificationService.markAllAsRead(req.user.id);
      return res.status(200).json(new ApiResponse(200, result, 'All notifications marked as read.'));
    } catch (error) {
      next(error);
    }
  }

  async dismiss(req, res, next) {
    try {
      const notif = await notificationService.dismiss(req.params.id, req.user.id);
      return res.status(200).json(new ApiResponse(200, notif, 'Notification dismissed.'));
    } catch (error) {
      next(error);
    }
  }

  async deleteNotification(req, res, next) {
    try {
      await notificationService.deleteNotification(req.params.id, req.user.id);
      return res.status(200).json(new ApiResponse(200, null, 'Notification deleted.'));
    } catch (error) {
      next(error);
    }
  }

  async generateReminders(req, res, next) {
    try {
      const created = await notificationService.generateUpcomingReminders(req.user.id);
      return res.status(200).json(new ApiResponse(200, { created: created.length }, `${created.length} reminder(s) generated.`));
    } catch (error) {
      next(error);
    }
  }
}

module.exports = new NotificationController();
