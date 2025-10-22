const Feed = require('../models/Feed');
const { parseQueryParams } = require('../utils/helpers');
const BaseController = require('./base.controller');

class FeedController extends BaseController {
    /**
     * Get all feeds with filtering
     * @param {Object} req - Express request object
     * @param {Object} res - Express response object
     */
    async getFeeds(req, res) {
        try {
            const filters = parseQueryParams(req.query);
            
            // Add user context if available
            if (req.user) {
                filters.user_id = req.user.id;
                filters.target_type = req.user.role;
            }

            const feeds = await Feed.getFeeds(filters);
            
            // Mark feeds as read for the current user if requested
            if (filters.mark_as_read && req.user) {
                await Promise.all(
                    feeds.map(feed => Feed.markAsRead(feed.id, req.user.id))
                );
            }
            
            return this.success(res, feeds);
        } catch (error) {
            return this.error(res, error);
        }
    }

    /**
     * Get a single feed by ID
     * @param {Object} req - Express request object
     * @param {Object} res - Express response object
     */
    async getFeed(req, res) {
        try {
            const { id } = req.params;
            const feed = await Feed.getById(id);
            
            if (!feed) {
                return this.notFound(res, 'Feed not found');
            }
            
            // Mark as read if requested
            if (req.query.mark_as_read === 'true' && req.user) {
                await Feed.markAsRead(id, req.user.id);
            }
            
            return this.success(res, feed);
        } catch (error) {
            return this.error(res, error);
        }
    }

    /**
     * Create a new feed
     * @param {Object} req - Express request object
     * @param {Object} res - Express response object
     */
    async createFeed(req, res) {
        try {
            // Add author information if authenticated
            if (req.user) {
                req.body.author_id = req.user.id;
            }
            
            const feed = await Feed.create(req.body);
            return this.created(res, feed);
        } catch (error) {
            return this.error(res, error);
        }
    }

    /**
     * Update a feed
     * @param {Object} req - Express request object
     * @param {Object} res - Express response object
     */
    async updateFeed(req, res) {
        try {
            const { id } = req.params;
            const feed = await Feed.getById(id);
            
            if (!feed) {
                return this.notFound(res, 'Feed not found');
            }
            
            // Check if user is author or admin
            if (req.user && req.user.id !== feed.author_id && req.user.role !== 'admin') {
                return this.forbidden(res, 'You do not have permission to update this feed');
            }
            
            const updatedFeed = await Feed.update(id, req.body);
            return this.success(res, updatedFeed);
        } catch (error) {
            return this.error(res, error);
        }
    }

    /**
     * Delete a feed
     * @param {Object} req - Express request object
     * @param {Object} res - Express response object
     */
    async deleteFeed(req, res) {
        try {
            const { id } = req.params;
            const feed = await Feed.getById(id);
            
            if (!feed) {
                return this.notFound(res, 'Feed not found');
            }
            
            // Check if user is author or admin
            if (req.user && req.user.id !== feed.author_id && req.user.role !== 'admin') {
                return this.forbidden(res, 'You do not have permission to delete this feed');
            }
            
            await Feed.delete(id);
            return this.success(res, { message: 'Feed deleted successfully' });
        } catch (error) {
            return this.error(res, error);
        }
    }

    /**
     * Mark a feed as read
     * @param {Object} req - Express request object
     * @param {Object} res - Express response object
     */
    async markAsRead(req, res) {
        try {
            if (!req.user) {
                return this.unauthorized(res);
            }
            
            const { id } = req.params;
            await Feed.markAsRead(id, req.user.id);
            
            return this.success(res, { message: 'Feed marked as read' });
        } catch (error) {
            return this.error(res, error);
        }
    }

    /**
     * Mark all feeds as read
     * @param {Object} req - Express request object
     * @param {Object} res - Express response object
     */
    async markAllAsRead(req, res) {
        try {
            if (!req.user) {
                return this.unauthorized(res);
            }
            
            await Feed.markAllAsRead(req.user.id, req.query);
            
            return this.success(res, { message: 'All feeds marked as read' });
        } catch (error) {
            return this.error(res, error);
        }
    }
}

module.exports = new FeedController();