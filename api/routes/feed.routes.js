const express = require('express');
const router = express.Router();
const feedController = require('../controllers/feed.controller');
const { authenticateJWT } = require('../middleware/auth');
const { feedValidator, handleValidationErrors } = require('../middleware/validators');

// Public routes - feeds are mostly public with role/target filtering
router.get('/', feedController.getFeeds.bind(feedController));
router.get('/:id', feedController.getFeed.bind(feedController));

// Protected routes
router.post('/', authenticateJWT, ...feedValidator, handleValidationErrors, feedController.createFeed.bind(feedController));
router.put('/:id', authenticateJWT, ...feedValidator, handleValidationErrors, feedController.updateFeed.bind(feedController));
router.delete('/:id', authenticateJWT, feedController.deleteFeed.bind(feedController));

// Read status endpoints
router.post('/:id/read', authenticateJWT, feedController.markAsRead.bind(feedController));
router.post('/read-all', authenticateJWT, feedController.markAllAsRead.bind(feedController));

module.exports = router;