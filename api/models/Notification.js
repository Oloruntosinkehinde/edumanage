const BaseModel = require('./BaseModel');
const { generateId } = require('../utils/helpers');

class Notification extends BaseModel {
    constructor() {
        super('notifications');
    }

    /**
     * Create a new notification
     * @param {Object} notification - Notification data
     * @returns {Promise<Object>} - Created notification
     */
    async create(notification) {
        const notificationData = {
            ...notification,
            id: notification.id || generateId('notif'),
            created_at: new Date()
        };
        
        return await super.create(notificationData);
    }

    /**
     * Get notifications for a user
     * @param {string} userId - User ID
     * @param {Object} filters - Filter options
     * @returns {Promise<Array>} - List of notifications
     */
    async getUserNotifications(userId, filters = {}) {
        const query = `
            SELECT * 
            FROM notifications
            WHERE user_id = ?
            ${filters.type ? `AND type = ?` : ''}
            ${filters.is_read !== undefined ? `AND is_read = ?` : ''}
            ${filters.related_entity_type ? `AND related_entity_type = ?` : ''}
            ${filters.related_entity_id ? `AND related_entity_id = ?` : ''}
            ORDER BY created_at DESC
            ${filters.limit ? `LIMIT ?` : ''}
            ${filters.offset ? `OFFSET ?` : ''}
        `;

        // Build params array
        let params = [userId];
        if (filters.type) params.push(filters.type);
        if (filters.is_read !== undefined) params.push(filters.is_read);
        if (filters.related_entity_type) params.push(filters.related_entity_type);
        if (filters.related_entity_id) params.push(filters.related_entity_id);
        if (filters.limit) params.push(parseInt(filters.limit));
        if (filters.offset) params.push(parseInt(filters.offset));

        return await this.query(query, params);
    }

    /**
     * Mark a notification as read
     * @param {string} notificationId - Notification ID
     * @param {string} userId - User ID (for security verification)
     * @returns {Promise<Object>} - Operation result
     */
    async markAsRead(notificationId, userId) {
        const query = `
            UPDATE notifications 
            SET is_read = 1, read_at = NOW() 
            WHERE id = ? AND user_id = ?
        `;
        
        return await this.query(query, [notificationId, userId]);
    }

    /**
     * Mark all notifications as read for a user
     * @param {string} userId - User ID
     * @param {Object} filters - Optional filters
     * @returns {Promise<Object>} - Operation result
     */
    async markAllAsRead(userId, filters = {}) {
        let query = `
            UPDATE notifications 
            SET is_read = 1, read_at = NOW() 
            WHERE user_id = ?
        `;
        
        let params = [userId];
        
        if (filters.type) {
            query += ` AND type = ?`;
            params.push(filters.type);
        }
        
        if (filters.related_entity_type) {
            query += ` AND related_entity_type = ?`;
            params.push(filters.related_entity_type);
        }
        
        return await this.query(query, params);
    }

    /**
     * Count unread notifications for a user
     * @param {string} userId - User ID
     * @returns {Promise<number>} - Count of unread notifications
     */
    async countUnread(userId) {
        const query = `
            SELECT COUNT(*) as count
            FROM notifications
            WHERE user_id = ? AND is_read = 0
        `;
        
        const result = await this.query(query, [userId]);
        return result[0].count;
    }

    /**
     * Send a notification to multiple users
     * @param {Array} userIds - Array of user IDs
     * @param {Object} notification - Notification data (without user_id)
     * @returns {Promise<Array>} - Created notifications
     */
    async sendToMultipleUsers(userIds, notification) {
        const notifications = userIds.map(userId => ({
            ...notification,
            id: generateId('notif'),
            user_id: userId,
            created_at: new Date()
        }));
        
        const placeholders = notifications.map(() => '(?, ?, ?, ?, ?, ?, ?, ?, ?)').join(', ');
        
        const query = `
            INSERT INTO notifications 
            (id, user_id, title, content, type, related_entity_type, related_entity_id, is_read, created_at) 
            VALUES ${placeholders}
        `;
        
        const params = notifications.flatMap(n => [
            n.id, 
            n.user_id, 
            n.title, 
            n.content || null, 
            n.type || 'info', 
            n.related_entity_type || null, 
            n.related_entity_id || null, 
            0,
            n.created_at
        ]);
        
        await this.query(query, params);
        return notifications;
    }
}

module.exports = new Notification();