const BaseModel = require('./BaseModel');
const { generateId } = require('../utils/helpers');

class Feed extends BaseModel {
    constructor() {
        super('feeds');
    }

    /**
     * Create a new feed
     * @param {Object} feed - Feed data
     * @returns {Promise<Object>} - Created feed
     */
    async create(feed) {
        const feedData = {
            ...feed,
            id: feed.id || generateId('feed'),
            created_at: new Date(),
            updated_at: new Date()
        };
        
        return await super.create(feedData);
    }

    /**
     * Get feeds with filtering options
     * @param {Object} filters - Filter options
     * @returns {Promise<Array>} - List of feeds
     */
    async getFeeds(filters = {}) {
        const query = `
            SELECT f.*, 
                   COALESCE(COUNT(fr.id), 0) as read_count,
                   GROUP_CONCAT(fr.user_id) as read_by_users
            FROM feeds f
            LEFT JOIN feed_reads fr ON f.id = fr.feed_id
            WHERE 1=1
            ${filters.category ? `AND f.category = ?` : ''}
            ${filters.target_type ? `AND (f.target_type = 'all' OR f.target_type = ?)` : ''}
            ${filters.user_id && filters.target_type ? `AND (JSON_CONTAINS(f.target_ids, ?) OR f.target_ids IS NULL)` : ''}
            ${filters.from_date ? `AND f.publish_date >= ?` : ''}
            ${filters.to_date ? `AND (f.expiry_date IS NULL OR f.expiry_date <= ?)` : ''}
            GROUP BY f.id
            ORDER BY f.is_pinned DESC, f.publish_date DESC
            ${filters.limit ? `LIMIT ?` : ''}
            ${filters.offset ? `OFFSET ?` : ''}
        `;

        // Build params array
        let params = [];
        if (filters.category) params.push(filters.category);
        if (filters.target_type) params.push(filters.target_type);
        if (filters.user_id && filters.target_type) params.push(JSON.stringify(filters.user_id));
        if (filters.from_date) params.push(filters.from_date);
        if (filters.to_date) params.push(filters.to_date);
        if (filters.limit) params.push(parseInt(filters.limit));
        if (filters.offset) params.push(parseInt(filters.offset));

        const results = await this.query(query, params);
        
        return results.map(feed => {
            const readByUsers = feed.read_by_users ? feed.read_by_users.split(',') : [];
            return {
                ...feed,
                read_by_users: readByUsers,
                target_ids: feed.target_ids ? JSON.parse(feed.target_ids) : null,
                metadata: feed.metadata ? JSON.parse(feed.metadata) : null
            };
        });
    }

    /**
     * Mark a feed as read for a user
     * @param {string} feedId - Feed ID
     * @param {string} userId - User ID
     * @returns {Promise<Object>} - Operation result
     */
    async markAsRead(feedId, userId) {
        const checkQuery = 'SELECT id FROM feed_reads WHERE feed_id = ? AND user_id = ?';
        const existingRecords = await this.query(checkQuery, [feedId, userId]);

        if (existingRecords.length > 0) {
            // Update existing record
            const updateQuery = 'UPDATE feed_reads SET is_read = 1, read_at = NOW() WHERE feed_id = ? AND user_id = ?';
            return await this.query(updateQuery, [feedId, userId]);
        } else {
            // Create new record
            const insertQuery = 'INSERT INTO feed_reads (feed_id, user_id, is_read, read_at) VALUES (?, ?, 1, NOW())';
            return await this.query(insertQuery, [feedId, userId]);
        }
    }

    /**
     * Mark all feeds as read for a user
     * @param {string} userId - User ID
     * @param {Object} filters - Optional filters (category, etc)
     * @returns {Promise<Object>} - Operation result
     */
    async markAllAsRead(userId, filters = {}) {
        // First get all feed IDs matching filters
        let filterQuery = `SELECT id FROM feeds WHERE 1=1`;
        let params = [];

        if (filters.category) {
            filterQuery += ` AND category = ?`;
            params.push(filters.category);
        }
        
        if (filters.target_type) {
            filterQuery += ` AND (target_type = 'all' OR target_type = ?)`;
            params.push(filters.target_type);
        }

        const feedIds = await this.query(filterQuery, params);
        
        if (feedIds.length === 0) {
            return { affected: 0 };
        }

        // Now mark all these as read
        const values = feedIds.map(feed => {
            return [feed.id, userId, 1];
        });

        const placeholders = values.map(() => '(?, ?, ?)').join(', ');
        const flatParams = values.flat();

        const query = `
            INSERT INTO feed_reads (feed_id, user_id, is_read) 
            VALUES ${placeholders}
            ON DUPLICATE KEY UPDATE is_read = 1, read_at = NOW()
        `;

        return await this.query(query, flatParams);
    }
}

module.exports = new Feed();