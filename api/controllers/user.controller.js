const BaseController = require('./base.controller');
const UserModel = require('../models/User');
const { createError } = require('../utils/errors');
const logger = require('../utils/logger');
const bcrypt = require('bcrypt');

class UserController extends BaseController {
  constructor() {
    super(UserModel, 'User');
  }

  // Override methods from base controller
  getAllUsers = this.getAllEntities;
  getUserById = this.getEntityById;
  createUser = this.createEntity;
  updateUser = this.updateEntity;
  deleteUser = this.deleteEntity;

  // Additional user-specific methods

  // Get authenticated user profile
  getProfile = async (req, res, next) => {
    try {
      const userId = req.user.id;
      const user = await UserModel.findById(userId);
      
      if (!user) {
        return next(createError('NOT_FOUND', 'User profile not found'));
      }
      
      // Remove sensitive information
      delete user.password;
      
      res.status(200).json({
        success: true,
        data: user
      });
    } catch (error) {
      logger.error('Error in getProfile:', error);
      next(error);
    }
  };

  // Update authenticated user profile
  updateProfile = async (req, res, next) => {
    try {
      const userId = req.user.id;
      const user = await UserModel.findById(userId);
      
      if (!user) {
        return next(createError('NOT_FOUND', 'User profile not found'));
      }
      
      // Prevent updating sensitive fields
      const { password, role, ...updateData } = req.body;
      
      const updatedUser = await UserModel.update(userId, updateData);
      
      // Remove sensitive information
      delete updatedUser.password;
      
      res.status(200).json({
        success: true,
        message: 'Profile updated successfully',
        data: updatedUser
      });
    } catch (error) {
      logger.error('Error in updateProfile:', error);
      next(error);
    }
  };

  // Change user password
  changePassword = async (req, res, next) => {
    try {
      const userId = req.user.id;
      const { currentPassword, newPassword } = req.body;
      
      // Validate request body
      if (!currentPassword || !newPassword) {
        return next(createError('VALIDATION_ERROR', 'Current password and new password are required'));
      }
      
      const user = await UserModel.findById(userId);
      
      if (!user) {
        return next(createError('NOT_FOUND', 'User not found'));
      }
      
      // Verify current password
      const isPasswordValid = await bcrypt.compare(currentPassword, user.password);
      
      if (!isPasswordValid) {
        return next(createError('UNAUTHORIZED', 'Current password is incorrect'));
      }
      
      // Hash the new password
      const salt = await bcrypt.genSalt(10);
      const hashedPassword = await bcrypt.hash(newPassword, salt);
      
      // Update password
      await UserModel.update(userId, { password: hashedPassword });
      
      res.status(200).json({
        success: true,
        message: 'Password changed successfully'
      });
    } catch (error) {
      logger.error('Error in changePassword:', error);
      next(error);
    }
  };
}

module.exports = new UserController();