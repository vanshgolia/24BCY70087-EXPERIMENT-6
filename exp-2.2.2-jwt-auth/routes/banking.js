const express = require('express');
const { verifyToken } = require('../middleware/auth');
const User = require('../models/User');
const router = express.Router();

// Apply auth middleware to ALL routes in this router
router.use(verifyToken);

// ─── GET /api/banking/balance ─────────────────────────────────────────────────
router.get('/balance', async (req, res) => {
  try {
    const user = await User.findById(req.user.id).select('-password -refreshToken');
    if (!user) return res.status(404).json({ message: 'User not found' });

    res.json({
      accountNumber: user.accountNumber,
      balance: user.balance,
      name: user.name
    });
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});

// ─── POST /api/banking/deposit ────────────────────────────────────────────────
router.post('/deposit', async (req, res) => {
  try {
    const { amount } = req.body;

    if (!amount || amount <= 0) {
      return res.status(400).json({ message: 'Amount must be a positive number' });
    }

    const user = await User.findByIdAndUpdate(
      req.user.id,
      { $inc: { balance: amount } },
      { new: true }
    );

    res.json({
      message: `Deposited Rs.${amount} successfully`,
      newBalance: user.balance
    });
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});

// ─── POST /api/banking/withdraw ───────────────────────────────────────────────
router.post('/withdraw', async (req, res) => {
  try {
    const { amount } = req.body;

    if (!amount || amount <= 0) {
      return res.status(400).json({ message: 'Amount must be a positive number' });
    }

    const user = await User.findById(req.user.id);
    if (!user) return res.status(404).json({ message: 'User not found' });

    if (user.balance < amount) {
      return res.status(400).json({
        message: 'Insufficient balance',
        currentBalance: user.balance
      });
    }

    user.balance -= amount;
    await user.save({ validateBeforeSave: false });

    res.json({
      message: `Withdrew Rs.${amount} successfully`,
      newBalance: user.balance
    });
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});

module.exports = router;
