const { body, param } = require('express-validator');

const notificationValidator = [
    body('user_id')
        .trim()
        .notEmpty()
        .withMessage('User ID is required'),
    
    body('title')
        .trim()
        .isLength({ min: 1, max: 255 })
        .withMessage('Title must be between 1 and 255 characters'),
    
    body('message')
        .trim()
        .isLength({ min: 1 })
        .withMessage('Message is required and cannot be empty'),
    
    body('type')
        .optional()
        .isIn(['info', 'success', 'warning', 'error', 'announcement'])
        .withMessage('Type must be one of: info, success, warning, error, announcement'),
    
    body('priority')
        .optional()
        .isIn(['low', 'normal', 'high', 'urgent'])
        .withMessage('Priority must be one of: low, normal, high, urgent'),
    
    body('category')
        .optional()
        .trim()
        .isLength({ max: 50 })
        .withMessage('Category must not exceed 50 characters'),
    
    body('action_url')
        .optional()
        .trim()
        .isURL()
        .withMessage('Action URL must be a valid URL'),
    
    body('metadata')
        .optional()
        .isObject()
        .withMessage('Metadata must be a valid JSON object'),
    
    body('is_read')
        .optional()
        .isBoolean()
        .withMessage('is_read must be a boolean'),
    
    body('read_at')
        .optional()
        .isISO8601()
        .withMessage('Read date must be a valid ISO 8601 date')
];

module.exports = notificationValidator;