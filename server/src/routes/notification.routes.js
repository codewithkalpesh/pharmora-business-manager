// src/routes/notification.routes.js
const express = require('express');
const router = express.Router();
const notificationController = require('../controllers/notification.controller');
const { authenticate } = require('../middlewares/auth.middleware');

router.use(authenticate);

// GET all notifications for current user (with optional ?status= filter)
router.get('/', notificationController.getNotifications);

// GET unread count (lightweight for header badge)
router.get('/unread-count', notificationController.getUnreadCount);

// POST generate reminders from recurring transactions
router.post('/generate-reminders', notificationController.generateReminders);

// PATCH mark all as read
router.patch('/mark-all-read', notificationController.markAllAsRead);

// PATCH mark a single notification as read
router.patch('/:id/read', notificationController.markAsRead);

// PATCH dismiss a single notification
router.patch('/:id/dismiss', notificationController.dismiss);

// DELETE a single notification
router.delete('/:id', notificationController.deleteNotification);

module.exports = router;
