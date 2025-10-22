const Notification = require('../models/Notification');
const { parseQueryParams } = require('../utils/helpers');
const BaseController = require('./base.controller');

class NotificationController extends BaseController {
    /**
     * Get notifications for the authenticated user
     * @param {Object} req - Express request object
     * @param {Object} res - Express response object
     */
    async getNotifications(req, res) {
        try {
            if (!req.user) {
                return this.unauthorized(res);
            }
            
            const filters = parseQueryParams(req.query);
            const notifications = await Notification.getUserNotifications(req.user.id, filters);
            
            return this.success(res, notifications);
        } catch (error) {
            return this.error(res, error);
        }
    }

    /**
     * Get a single notification
     * @param {Object} req - Express request object
     * @param {Object} res - Express response object
     */
    async getNotification(req, res) {
        try {
            if (!req.user) {
                return this.unauthorized(res);
            }
            
            const { id } = req.params;
            const notification = await Notification.getById(id);
            
            if (!notification) {
                return this.notFound(res, 'Notification not found');
            }
            
            // Security check - users can only see their own notifications
            if (notification.user_id !== req.user.id && req.user.role !== 'admin') {
                return this.forbidden(res, 'Access denied');
            }
            
            // Mark as read if requested
            if (req.query.mark_as_read === 'true') {
                await Notification.markAsRead(id, req.user.id);
            }
            
            return this.success(res, notification);
        } catch (error) {
            return this.error(res, error);
        }
    }

    /**
     * Create a new notification
     * @param {Object} req - Express request object
     * @param {Object} res - Express response object
     */
    async createNotification(req, res) {
        try {
            // Only admins can create notifications directly
            if (req.user && req.user.role !== 'admin') {
                return this.forbidden(res, 'Only admins can create notifications directly');
            }
            
            const notification = await Notification.create(req.body);
            return this.created(res, notification);
        } catch (error) {
            return this.error(res, error);
        }
    }

    /**
     * Send notification to multiple users
     * @param {Object} req - Express request object
     * @param {Object} res - Express response object
     */
    async sendToMultipleUsers(req, res) {
        try {
            // Only admins can create notifications directly
            if (req.user && req.user.role !== 'admin') {
                return this.forbidden(res, 'Only admins can send notifications');
            }
            
            const { userIds, notification } = req.body;
            
            if (!Array.isArray(userIds) || !notification) {
                return this.badRequest(res, 'Invalid request. Provide userIds array and notification object');
            }
            
            const result = await Notification.sendToMultipleUsers(userIds, notification);
            return this.created(res, {
                message: 'Notifications sent successfully',
                count: result.length
            });
        } catch (error) {
            return this.error(res, error);
        }
    }

    /**
     * Mark a notification as read
     * @param {Object} req - Express request object
     * @param {Object} res - Express response object
     */
    async markAsRead(req, res) {
        try {
            if (!req.user) {
                return this.unauthorized(res);
            }
            
            const { id } = req.params;
            await Notification.markAsRead(id, req.user.id);
            
            return this.success(res, { message: 'Notification marked as read' });
        } catch (error) {
            return this.error(res, error);
        }
    }

    /**
     * Mark all notifications as read
     * @param {Object} req - Express request object
     * @param {Object} res - Express response object
     */
    async markAllAsRead(req, res) {
        try {
            if (!req.user) {
                return this.unauthorized(res);
            }
            
            await Notification.markAllAsRead(req.user.id, req.query);
            
            return this.success(res, { message: 'All notifications marked as read' });
        } catch (error) {
            return this.error(res, error);
        }
    }

    /**
     * Get unread notification count
     * @param {Object} req - Express request object
     * @param {Object} res - Express response object
     */
    async getUnreadCount(req, res) {
        try {
            if (!req.user) {
                return this.unauthorized(res);
            }
            
            const count = await Notification.countUnread(req.user.id);
            
            return this.success(res, { count });
        } catch (error) {
            return this.error(res, error);
        }
    }

    /**
     * Delete a notification
     * @param {Object} req - Express request object
     * @param {Object} res - Express response object
     */
    async deleteNotification(req, res) {
        try {
            if (!req.user) {
                return this.unauthorized(res);
            }
            
            const { id } = req.params;
            const notification = await Notification.getById(id);
            
            if (!notification) {
                return this.notFound(res, 'Notification not found');
            }
            
            // Security check - users can only delete their own notifications
            if (notification.user_id !== req.user.id && req.user.role !== 'admin') {
                return this.forbidden(res, 'Access denied');
            }
            
            await Notification.delete(id);
            return this.success(res, { message: 'Notification deleted successfully' });
        } catch (error) {
            return this.error(res, error);
        }
    }
}

module.exports = new NotificationController();