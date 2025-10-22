const { body, param } = require('express-validator');

const feedValidator = [
    body('title')
        .optional()
        .trim()
        .isLength({ min: 1, max: 255 })
        .withMessage('Title must be between 1 and 255 characters'),
    
    body('content')
        .optional()
        .trim()
        .isLength({ min: 1 })
        .withMessage('Content is required and cannot be empty'),
    
    body('type')
        .optional()
        .isIn(['announcement', 'event', 'alert', 'news', 'update'])
        .withMessage('Type must be one of: announcement, event, alert, news, update'),
    
    body('priority')
        .optional()
        .isIn(['low', 'normal', 'high', 'urgent'])
        .withMessage('Priority must be one of: low, normal, high, urgent'),
    
    body('target_type')
        .optional()
        .isIn(['all', 'student', 'teacher', 'admin', 'parent'])
        .withMessage('Target type must be one of: all, student, teacher, admin, parent'),
    
    body('target_ids')
        .optional()
        .isArray()
        .withMessage('Target IDs must be an array'),
    
    body('author_id')
        .optional()
        .trim()
        .notEmpty()
        .withMessage('Author ID cannot be empty'),
    
    body('metadata')
        .optional()
        .isObject()
        .withMessage('Metadata must be a valid JSON object'),
    
    body('is_pinned')
        .optional()
        .isBoolean()
        .withMessage('is_pinned must be a boolean'),
    
    body('expires_at')
        .optional()
        .isISO8601()
        .withMessage('Expiration date must be a valid ISO 8601 date'),
    
    body('published_at')
        .optional()
        .isISO8601()
        .withMessage('Published date must be a valid ISO 8601 date')
];

module.exports = feedValidator;