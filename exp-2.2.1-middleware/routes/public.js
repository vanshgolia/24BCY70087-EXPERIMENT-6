const express = require('express');
const jwt = require('jsonwebtoken');
const router = express.Router();

/**
 * Public Routes — No authentication required
 */

// GET /api/public/health
router.get('/health', (req, res) => {
  res.json({ success: true, message: 'Server is running', timestamp: new Date().toISOString() });
});

// POST /api/public/login — demo: generate a token for testing
router.post('/login', (req, res) => {
  const { email, password } = req.body;

  // Demo credentials (not for production use)
  if (email === 'test@bank.com' && password === 'password123') {
    const token = jwt.sign(
      { id: 'demo_user_001', email },
      process.env.JWT_SECRET,
      { expiresIn: '1h' }
    );
    return res.json({ success: true, message: 'Login successful', token });
  }

  res.status(401).json({ success: false, message: 'Invalid credentials' });
});

// GET /api/public/error — demo: trigger error middleware
router.get('/error', (req, res, next) => {
  const err = new Error('Simulated server error for testing');
  err.status = 500;
  next(err); // passes to errorHandler middleware
});

module.exports = router;
