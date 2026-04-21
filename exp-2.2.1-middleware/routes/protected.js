const express = require('express');
const { verifyToken } = require('../middleware/auth');
const router = express.Router();

// Apply auth middleware to all routes in this router
router.use(verifyToken);

/**
 * Protected Routes — JWT required
 */

// GET /api/protected/dashboard
router.get('/dashboard', (req, res) => {
  res.json({
    success: true,
    message: 'Welcome to the protected dashboard!',
    user: req.user
  });
});

// GET /api/protected/profile
router.get('/profile', (req, res) => {
  res.json({
    success: true,
    message: 'User profile data',
    user: {
      id: req.user.id,
      email: req.user.email
    }
  });
});

// GET /api/protected/admin — only reached after middleware chain
router.get('/admin', (req, res) => {
  res.json({
    success: true,
    message: 'Admin area — middleware chain completed successfully',
    middlewareSequence: ['logger → verifyToken → route handler']
  });
});

module.exports = router;
