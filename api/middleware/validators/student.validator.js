const { body, validationResult } = require('express-validator');

/**
 * Validation middleware for student data
 */
const validateStudent = [
    body('id')
        .optional()
        .isString()
        .trim()
        .isLength({ min: 1, max: 20 })
        .withMessage('Student ID must be between 1 and 20 characters'),
    
    body('name')
        .notEmpty()
        .withMessage('Student name is required')
        .trim()
        .isLength({ min: 2, max: 150 })
        .withMessage('Student name must be between 2 and 150 characters'),
    
    body('email')
        .optional()
        .isEmail()
        .withMessage('Must be a valid email address')
        .normalizeEmail(),
    
    body('class')
        .optional()
        .trim()
        .isLength({ max: 40 })
        .withMessage('Class name must not exceed 40 characters'),
    
    body('subjects')
        .optional()
        .isArray()
        .withMessage('Subjects must be an array'),
    
    body('guardian')
        .optional()
        .trim()
        .isLength({ max: 150 })
        .withMessage('Guardian name must not exceed 150 characters'),
    
    body('phone')
        .optional()
        .trim()
        .isLength({ max: 40 })
        .withMessage('Phone number must not exceed 40 characters'),
    
    body('address')
        .optional()
        .trim(),
    
    body('date_of_birth')
        .optional()
        .isISO8601()
        .withMessage('Date of birth must be a valid date'),
    
    body('enrollment_date')
        .optional()
        .isISO8601()
        .withMessage('Enrollment date must be a valid date'),
    
    body('status')
        .optional()
        .isIn(['active', 'inactive', 'graduated', 'suspended'])
        .withMessage('Status must be one of: active, inactive, graduated, suspended'),
    
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
    validateStudent
};