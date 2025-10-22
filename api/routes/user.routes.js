const express = require('express');
const router = express.Router();
const userController = require('../controllers/user.controller');
const { userValidator } = require('../middleware/validators');
const { authenticateJWT, isAdmin } = require('../middleware/auth');

// User profile routes MUST come before /:id routes to avoid conflicts
router.get('/profile', authenticateJWT, userController.getProfile);
router.put('/profile', authenticateJWT, userController.updateProfile);
router.put('/change-password', authenticateJWT, userController.changePassword);

// User management routes (protected, admin only)
router.get('/', authenticateJWT, isAdmin, userController.getAllUsers);
router.get('/:id', authenticateJWT, isAdmin, userController.getUserById);
router.post('/', authenticateJWT, isAdmin, userValidator, userController.createUser);
router.put('/:id', authenticateJWT, isAdmin, userValidator, userController.updateUser);
router.delete('/:id', authenticateJWT, isAdmin, userController.deleteUser);

module.exports = router;