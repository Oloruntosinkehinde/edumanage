/**
 * Session-based authentication middleware
 */

const { createError } = require('../utils/errors');

/**
 * Check if user is authenticated via session
 */
const isAuthenticated = (req, res, next) => {
  if (req.session && req.session.user) {
    return next();
  }
  return next(createError('UNAUTHORIZED', 'Please login to access this resource'));
};

/**
 * Check if user has specific role
 */
const hasRole = (...roles) => {
  return (req, res, next) => {
    if (!req.session || !req.session.user) {
      return next(createError('UNAUTHORIZED', 'Please login to access this resource'));
    }

    if (roles.includes(req.session.user.role)) {
      return next();
    }

    return next(createError('FORBIDDEN', 'You do not have permission to access this resource'));
  };
};

module.exports = {
  isAuthenticated,
  hasRole
};
