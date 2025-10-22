const logger = require('../utils/logger');

// Error handling middleware
const errorHandler = (err, req, res, next) => {
  // Log the error
  logger.error(`${err.name}: ${err.message}`, { 
    method: req.method,
    url: req.url,
    body: req.body,
    stack: err.stack
  });

  // Determine status code
  const statusCode = err.statusCode || 500;
  
  // Format the error response
  const errorResponse = {
    error: {
      message: statusCode === 500 ? 'Internal server error' : err.message,
      code: err.code || 'SERVER_ERROR'
    }
  };

  // Include stack trace in development environment
  if (process.env.NODE_ENV === 'development') {
    errorResponse.error.stack = err.stack;
  }

  // Send the error response
  res.status(statusCode).json(errorResponse);
};

module.exports = errorHandler;