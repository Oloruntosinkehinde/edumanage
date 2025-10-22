const { body, validationResult } = require('express-validator');

/**
 * Validation middleware for subject data
 */
const validateSubject = [
    body('id')
        .optional()
        .isString()
        .trim()
        .isLength({ min: 1, max: 20 })
        .withMessage('Subject ID must be between 1 and 20 characters'),
    
    body('code')
        .notEmpty()
        .withMessage('Subject code is required')
        .trim()
        .isLength({ min: 2, max: 20 })
        .withMessage('Subject code must be between 2 and 20 characters'),
    
    body('title')
        .notEmpty()
        .withMessage('Subject title is required')
        .trim()
        .isLength({ min: 2, max: 150 })
        .withMessage('Subject title must be between 2 and 150 characters'),
    
    body('description')
        .optional()
        .trim(),
    
    body('department')
        .optional()
        .trim()
        .isLength({ max: 100 })
        .withMessage('Department must not exceed 100 characters'),
    
    body('level')
        .optional()
        .trim()
        .isLength({ max: 50 })
        .withMessage('Level must not exceed 50 characters'),
    
    body('credits')
        .optional()
        .isInt({ min: 0, max: 255 })
        .withMessage('Credits must be between 0 and 255'),
    
    body('teacher_ids')
        .optional()
        .isArray()
        .withMessage('Teacher IDs must be an array'),
    
    body('schedule_json')
        .optional(),
    
    body('sort_order')
        .optional()
        .isInt()
        .withMessage('Sort order must be an integer'),
    
    body('status')
        .optional()
        .isIn(['active', 'inactive', 'archived'])
        .withMessage('Status must be one of: active, inactive, archived'),
    
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
    validateSubject
};