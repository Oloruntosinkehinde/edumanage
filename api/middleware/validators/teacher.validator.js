const { body, validationResult } = require('express-validator');

/**
 * Validation middleware for teacher data
 */
const validateTeacher = [
    body('id')
        .optional()
        .isString()
        .trim()
        .isLength({ min: 1, max: 20 })
        .withMessage('Teacher ID must be between 1 and 20 characters'),
    
    body('name')
        .notEmpty()
        .withMessage('Teacher name is required')
        .trim()
        .isLength({ min: 2, max: 150 })
        .withMessage('Teacher name must be between 2 and 150 characters'),
    
    body('email')
        .optional()
        .isEmail()
        .withMessage('Must be a valid email address')
        .normalizeEmail(),
    
    body('subjects')
        .optional()
        .isArray()
        .withMessage('Subjects must be an array'),
    
    body('classes')
        .optional()
        .isArray()
        .withMessage('Classes must be an array'),
    
    body('phone')
        .optional()
        .trim()
        .isLength({ max: 40 })
        .withMessage('Phone number must not exceed 40 characters'),
    
    body('qualification')
        .optional()
        .trim()
        .isLength({ max: 255 })
        .withMessage('Qualification must not exceed 255 characters'),
    
    body('experience')
        .optional()
        .trim()
        .isLength({ max: 100 })
        .withMessage('Experience must not exceed 100 characters'),
    
    body('join_date')
        .optional()
        .isISO8601()
        .withMessage('Join date must be a valid date'),
    
    body('status')
        .optional()
        .isIn(['active', 'inactive', 'retired', 'sabbatical'])
        .withMessage('Status must be one of: active, inactive, retired, sabbatical'),
    
    // Handle validation errors
    (req, res, next) => {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({
                success: false,
                message: 'Validation error',
                errors: errors.array()
            });
        }
        next();
    }
];

module.exports = {
    validateTeacher
};