const { body, validationResult } = require('express-validator');
const { createError } = require('../../utils/errors');

// Validation middleware
const validate = (req, res, next) => {
  const errors = validationResult(req);
  
  if (!errors.isEmpty()) {
    const errorMessages = errors.array().map(error => error.msg);
    return next(createError('VALIDATION_ERROR', errorMessages.join(', ')));
  }
  
  next();
};

// Login validation rules
const validateLogin = [
  body('email')
    .notEmpty().withMessage('Email is required')
    .isEmail().withMessage('Please provide a valid email'),
  body('password')
    .notEmpty().withMessage('Password is required'),
  validate
];

// Registration validation rules
const validateRegistration = [
  body('email')
    .notEmpty().withMessage('Email is required')
    .isEmail().withMessage('Please provide a valid email'),
  body('password')
    .notEmpty().withMessage('Password is required')
    .isLength({ min: 6 }).withMessage('Password must be at least 6 characters'),
  body('firstName')
    .notEmpty().withMessage('First name is required'),
  body('lastName')
    .notEmpty().withMessage('Last name is required'),
  body('role')
    .optional()
    .isIn(['admin', 'teacher', 'student']).withMessage('Invalid role'),
  validate
];

module.exports = {
  validateLogin,
  validateRegistration
};