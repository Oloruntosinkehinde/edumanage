const jwt = require('jsonwebtoken');
const { JWT_SECRET } = process.env;
const { AppError } = require('../utils/errors');

// Authenticate JWT middleware
const authenticateJWT = (req, res, next) => {
  try {
    // Get the token from the authorization header
    const authHeader = req.headers.authorization;
    
    if (!authHeader) {
      throw new AppError('No token provided', 401, 'UNAUTHORIZED');
    }

    // Check if the header has the Bearer format
    const parts = authHeader.split(' ');
    if (parts.length !== 2 || parts[0] !== 'Bearer') {
      throw new AppError('Token error', 401, 'UNAUTHORIZED');
    }

    const token = parts[1];
    
    // Verify the token
    jwt.verify(token, JWT_SECRET, (err, decoded) => {
      if (err) {
        throw new AppError('Invalid token', 401, 'UNAUTHORIZED');
      }
      
      // Add the user data to the request
      req.user = decoded;
      next();
    });
  } catch (error) {
    next(error);
  }
};

// Check if user is admin middleware
const isAdmin = (req, res, next) => {
  try {
    if (!req.user || req.user.role !== 'admin') {
      throw new AppError('Access denied: Admin privileges required', 403, 'FORBIDDEN');
    }
    next();
  } catch (error) {
    next(error);
  }
};

// Check if user is teacher middleware
const isTeacher = (req, res, next) => {
  try {
    if (!req.user || (req.user.role !== 'teacher' && req.user.role !== 'admin')) {
      throw new AppError('Access denied: Teacher privileges required', 403, 'FORBIDDEN');
    }
    next();
  } catch (error) {
    next(error);
  }
};

// Check if user is student middleware
const isStudent = (req, res, next) => {
  try {
    if (!req.user || (req.user.role !== 'student' && req.user.role !== 'admin')) {
      throw new AppError('Access denied: Student privileges required', 403, 'FORBIDDEN');
    }
    next();
  } catch (error) {
    next(error);
  }
};

// Check if user can access specific resource
const canAccessResource = (resourceType) => {
  return (req, res, next) => {
    try {
      const resourceId = req.params.id;
      const userId = req.user.id;
      const userRole = req.user.role;

      // Admin can access any resource
      if (userRole === 'admin') {
        return next();
      }

      // For specific resource types, check if user has access
      if (resourceType === 'student' && userRole === 'student') {
        // Students can only access their own resources
        if (userId === resourceId) {
          return next();
        }
      } else if (resourceType === 'teacher' && userRole === 'teacher') {
        // Teachers can only access their own resources
        if (userId === resourceId) {
          return next();
        }
      }

      throw new AppError('Access denied: You do not have permission to access this resource', 403, 'FORBIDDEN');
    } catch (error) {
      next(error);
    }
  };
};

module.exports = {
  authenticateJWT,
  isAdmin,
  isTeacher,
  isStudent,
  canAccessResource
};