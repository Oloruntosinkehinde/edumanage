const { body, validationResult } = require('express-validator');

/**
 * Validation middleware for result data
 */
const validateResult = [
    body('id')
        .optional()
        .isString()
        .trim()
        .isLength({ min: 1, max: 40 })
        .withMessage('Result ID must be between 1 and 40 characters'),
    
    body('student_id')
        .notEmpty()
        .withMessage('Student ID is required')
        .trim()
        .isLength({ min: 1, max: 20 })
        .withMessage('Student ID must be between 1 and 20 characters'),
    
    body('subject_id')
        .notEmpty()
        .withMessage('Subject ID is required')
        .trim()
        .isLength({ min: 1, max: 20 })
        .withMessage('Subject ID must be between 1 and 20 characters'),
    
    body('class')
        .optional()
        .trim()
        .isLength({ max: 40 })
        .withMessage('Class must not exceed 40 characters'),
    
    body('session')
        .optional()
        .trim()
        .isLength({ max: 20 })
        .withMessage('Session must not exceed 20 characters'),
    
    body('term')
        .optional()
        .trim()
        .isLength({ max: 50 })
        .withMessage('Term must not exceed 50 characters'),
    
    body('score')
        .optional()
        .isFloat({ min: 0, max: 100 })
        .withMessage('Score must be between 0 and 100'),
    
    body('grade')
        .optional()
        .trim()
        .isLength({ max: 5 })
        .withMessage('Grade must not exceed 5 characters'),
    
    body('remarks')
        .optional()
        .trim(),
    
    body('published_at')
        .optional()
        .isISO8601()
        .withMessage('Published date must be a valid date'),
    
    body('recorded_at')
        .optional()
        .isISO8601()
        .withMessage('Recorded date must be a valid date'),
    
    body('metadata')
        .optional(),
    
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
    validateResult
};