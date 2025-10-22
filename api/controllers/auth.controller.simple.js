const bcrypt = require('bcrypt');
const db = require('../config/database');
const { createError } = require('../utils/errors');

class AuthController {
  // User login with session
  login = async (req, res, next) => {
    try {
      const { email, password } = req.body;
      console.log('Login attempt:', email);

      // Find user by email - direct query
      const [users] = await db.query(
        'SELECT * FROM users WHERE email = ? LIMIT 1',
        [email]
      );
      
      const user = users[0];
      console.log('User found:', user ? `Yes (${user.email})` : 'No');
      
      if (!user) {
        return next(createError('UNAUTHORIZED', 'Invalid email or password'));
      }

      // Check if account is active
      if (user.status !== 'active') {
        return next(createError('UNAUTHORIZED', 'Account is disabled'));
      }

      // Compare passwords
      const isPasswordValid = await bcrypt.compare(password, user.password);
      console.log('Password valid:', isPasswordValid);
      
      if (!isPasswordValid) {
        return next(createError('UNAUTHORIZED', 'Invalid email or password'));
      }

      // Update last login
      await db.query(
        'UPDATE users SET last_login = ? WHERE id = ?',
        [new Date(), user.id]
      );

      // Store user in session
      req.session.user = {
        id: user.id,
        username: user.username,
        email: user.email,
        full_name: user.full_name,
        role: user.role
      };

      console.log('Login successful for:', user.email);

      res.json({
        success: true,
        message: 'Login successful',
        data: {
          user: req.session.user
        }
      });
    } catch (error) {
      console.error('Login error:', error);
      next(error);
    }
  };

  // Logout
  logout = async (req, res, next) => {
    try {
      req.session.destroy((err) => {
        if (err) {
          return next(createError('INTERNAL_SERVER_ERROR', 'Could not logout'));
        }
        res.json({
          success: true,
          message: 'Logout successful'
        });
      });
    } catch (error) {
      next(error);
    }
  };

  // Get current user
  me = async (req, res, next) => {
    try {
      if (!req.session || !req.session.user) {
        return next(createError('UNAUTHORIZED', 'Not authenticated'));
      }

      res.json({
        success: true,
        data: {
          user: req.session.user
        }
      });
    } catch (error) {
      next(error);
    }
  };
}

module.exports = new AuthController();
