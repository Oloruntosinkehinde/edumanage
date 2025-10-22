const express = require('express');
const router = express.Router();
const notificationController = require('../controllers/notification.controller');
const { authenticateJWT, isAdmin } = require('../middleware/auth');
const { notificationValidator, handleValidationErrors } = require('../middleware/validators');

// All notification routes are protected - require authentication
router.use(authenticateJWT);

// Get user's notifications
router.get('/', notificationController.getNotifications.bind(notificationController));
router.get('/unread-count', notificationController.getUnreadCount.bind(notificationController));
router.get('/:id', notificationController.getNotification.bind(notificationController));

// Admin only routes
router.post('/', 
    isAdmin, 
    ...notificationValidator,
    handleValidationErrors, 
    notificationController.createNotification.bind(notificationController)
);

router.post('/send-multiple',
    isAdmin,
    notificationController.sendToMultipleUsers.bind(notificationController)
);

// User routes
router.post('/:id/read', notificationController.markAsRead.bind(notificationController));
router.post('/read-all', notificationController.markAllAsRead.bind(notificationController));
router.delete('/:id', notificationController.deleteNotification.bind(notificationController));

module.exports = router;