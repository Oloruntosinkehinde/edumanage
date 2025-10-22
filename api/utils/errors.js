// Custom application error class
class AppError extends Error {
  constructor(message, statusCode, code) {
    super(message);
    this.name = this.constructor.name;
    this.statusCode = statusCode;
    this.code = code;
    Error.captureStackTrace(this, this.constructor);
  }
}

// Error types
const ErrorTypes = {
  VALIDATION_ERROR: {
    message: 'Validation error',
    statusCode: 400,
    code: 'VALIDATION_ERROR'
  },
  UNAUTHORIZED: {
    message: 'Unauthorized access',
    statusCode: 401,
    code: 'UNAUTHORIZED'
  },
  FORBIDDEN: {
    message: 'Forbidden access',
    statusCode: 403,
    code: 'FORBIDDEN'
  },
  NOT_FOUND: {
    message: 'Resource not found',
    statusCode: 404,
    code: 'NOT_FOUND'
  },
  CONFLICT: {
    message: 'Resource conflict',
    statusCode: 409,
    code: 'CONFLICT'
  },
  SERVER_ERROR: {
    message: 'Internal server error',
    statusCode: 500,
    code: 'SERVER_ERROR'
  },
  DATABASE_ERROR: {
    message: 'Database error',
    statusCode: 500,
    code: 'DATABASE_ERROR'
  }
};

// Create specific error instances
const createError = (type, customMessage = null) => {
  const errorConfig = ErrorTypes[type];
  if (!errorConfig) {
    return new AppError('Unknown error', 500, 'SERVER_ERROR');
  }
  
  const message = customMessage || errorConfig.message;
  return new AppError(message, errorConfig.statusCode, errorConfig.code);
};

module.exports = {
  AppError,
  ErrorTypes,
  createError
};