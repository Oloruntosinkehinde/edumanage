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

// Payment validation rules
const validatePayment = [
  body('studentId')
    .notEmpty().withMessage('Student ID is required')
    .isInt().withMessage('Student ID must be an integer'),
  body('amount')
    .notEmpty().withMessage('Amount is required')
    .isFloat({ min: 0 }).withMessage('Amount must be a positive number'),
  body('description')
    .notEmpty().withMessage('Description is required'),
  body('paymentDate')
    .optional()
    .isISO8601().withMessage('Payment date must be a valid date'),
  body('dueDate')
    .notEmpty().withMessage('Due date is required')
    .isISO8601().withMessage('Due date must be a valid date'),
  body('status')
    .notEmpty().withMessage('Status is required')
    .isIn(['pending', 'paid', 'overdue', 'canceled', 'refunded']).withMessage('Invalid status'),
  body('paymentMethod')
    .optional()
    .isIn(['cash', 'credit_card', 'bank_transfer', 'check', 'online', 'other']).withMessage('Invalid payment method'),
  validate
];

module.exports = {
  validatePayment
};