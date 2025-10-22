const { body, validationResult } = require('express-validator');

/**
 * Generic validation result handler
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Express next middleware function
 */
const handleValidationErrors = (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({
            success: false,
            message: 'Validation error',
            errors: errors.array()
        });
    }
    next();
};

/**
 * Feed validation rules
 */
const feedValidator = [
    body('title')
        .notEmpty().withMessage('Title is required')
        .isLength({ max: 150 }).withMessage('Title must be less than 150 characters'),
    
    body('content')
        .optional()
        .isLength({ max: 5000 }).withMessage('Content must be less than 5000 characters'),
    
    body('category')
        .optional()
        .isIn(['announcement', 'news', 'event', 'assignment', 'result', 'general'])
        .withMessage('Invalid category'),
    
    body('priority')
        .optional()
        .isIn(['low', 'normal', 'high', 'urgent'])
        .withMessage('Invalid priority'),
    
    body('target_type')
        .optional()
        .isString()
        .withMessage('Target type must be a string'),
    
    body('target_ids')
        .optional()
        .isArray()
        .withMessage('Target IDs must be an array'),
    
    body('publish_date')
        .optional()
        .isISO8601()
        .withMessage('Publish date must be a valid date'),
    
    body('expiry_date')
        .optional()
        .isISO8601()
        .withMessage('Expiry date must be a valid date'),
    
    body('is_pinned')
        .optional()
        .isBoolean()
        .withMessage('Is pinned must be a boolean'),
    
    handleValidationErrors
];

/**
 * Notification validation rules
 */
const notificationValidator = [
    body('user_id')
        .notEmpty().withMessage('User ID is required'),
    
    body('title')
        .notEmpty().withMessage('Title is required')
        .isLength({ max: 150 }).withMessage('Title must be less than 150 characters'),
    
    body('content')
        .optional()
        .isLength({ max: 1000 }).withMessage('Content must be less than 1000 characters'),
    
    body('type')
        .optional()
        .isIn(['info', 'success', 'warning', 'error'])
        .withMessage('Invalid notification type'),
    
    handleValidationErrors
];

/**
 * User validation rules
 */
const userValidator = [
    body('username')
        .notEmpty().withMessage('Username is required')
        .isLength({ min: 3, max: 50 }).withMessage('Username must be between 3 and 50 characters')
        .matches(/^[a-zA-Z0-9._-]+$/).withMessage('Username can only contain letters, numbers, and ._-'),
    
    body('password')
        .notEmpty().withMessage('Password is required')
        .isLength({ min: 6 }).withMessage('Password must be at least 6 characters'),
    
    body('email')
        .optional()
        .isEmail().withMessage('Email must be valid'),
    
    body('role')
        .optional()
        .isIn(['admin', 'teacher', 'student', 'parent', 'staff'])
        .withMessage('Invalid role'),
    
    handleValidationErrors
];

/**
 * Login validation rules
 */
const loginValidator = [
    body('username')
        .notEmpty().withMessage('Username is required'),
    
    body('password')
        .notEmpty().withMessage('Password is required'),
    
    handleValidationErrors
];

module.exports = {
    handleValidationErrors,
    feedValidator,
    notificationValidator,
    userValidator,
    loginValidator
};