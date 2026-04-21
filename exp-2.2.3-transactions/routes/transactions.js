const express = require('express');
const mongoose = require('mongoose');
const { verifyToken } = require('../middleware/auth');
const User = require('../models/User');
const TransactionLog = require('../models/TransactionLog');
const router = express.Router();

// All routes require authentication
router.use(verifyToken);

// ─── POST /api/transactions/transfer ──────────────────────────────────────────
/**
 * ACID-compliant money transfer using MongoDB sessions.
 *
 * ACID Properties demonstrated:
 *   Atomicity   — both debit and credit happen, or neither does
 *   Consistency — balance never goes negative; DB constraints enforced
 *   Isolation   — session isolates changes until commit
 *   Durability  — committed transaction persists even if server crashes
 *
 * On any error, session.abortTransaction() performs a full rollback.
 */
router.post('/transfer', async (req, res) => {
  const { toAccountNumber, amount } = req.body;

  if (!toAccountNumber || !amount || amount <= 0) {
    return res.status(400).json({ message: 'toAccountNumber and a positive amount are required' });
  }

  // Start a MongoDB session for the transaction
  const session = await mongoose.startSession();

  const logEntry = {
    transactionId: 'TXN' + Date.now() + Math.floor(Math.random() * 10000),
    fromAccount: '',
    toAccount: toAccountNumber,
    amount,
    initiatedBy: req.user.id
  };

  try {
    session.startTransaction();

    // 1. Fetch sender (within session)
    const sender = await User.findById(req.user.id).session(session);
    if (!sender) {
      await session.abortTransaction();
      return res.status(404).json({ message: 'Sender account not found' });
    }

    logEntry.fromAccount = sender.accountNumber;
    logEntry.fromBalanceBefore = sender.balance;

    // 2. Fetch recipient (within session)
    const recipient = await User.findOne({ accountNumber: toAccountNumber }).session(session);
    if (!recipient) {
      await session.abortTransaction();
      return res.status(404).json({ message: `Recipient account ${toAccountNumber} not found` });
    }

    if (sender.accountNumber === toAccountNumber) {
      await session.abortTransaction();
      return res.status(400).json({ message: 'Cannot transfer to your own account' });
    }

    logEntry.toBalanceBefore = recipient.balance;

    // 3. Check sufficient balance (Consistency)
    if (sender.balance < amount) {
      await session.abortTransaction();

      // Log the failed attempt
      await TransactionLog.create([{
        ...logEntry,
        status: 'FAILED',
        reason: `Insufficient balance. Available: Rs.${sender.balance}, Requested: Rs.${amount}`
      }]);

      return res.status(400).json({
        message: 'Insufficient balance',
        currentBalance: sender.balance,
        requestedAmount: amount
      });
    }

    // 4. Debit sender (Atomicity — part 1)
    sender.balance -= amount;
    await sender.save({ session, validateBeforeSave: false });

    // 5. Credit recipient (Atomicity — part 2)
    recipient.balance += amount;
    await recipient.save({ session, validateBeforeSave: false });

    logEntry.fromBalanceAfter = sender.balance;
    logEntry.toBalanceAfter = recipient.balance;

    // 6. Commit — both operations succeed together (Durability)
    await session.commitTransaction();

    // 7. Log the successful transaction
    const txnLog = await TransactionLog.create([{
      ...logEntry,
      status: 'SUCCESS'
    }]);

    res.json({
      message: 'Transfer successful',
      transactionId: txnLog[0].transactionId,
      from: {
        accountNumber: sender.accountNumber,
        newBalance: sender.balance
      },
      to: {
        accountNumber: recipient.accountNumber,
        name: recipient.name
      },
      amount
    });

  } catch (err) {
    // Any unexpected error triggers a full rollback (Atomicity)
    await session.abortTransaction();

    // Log the rollback
    await TransactionLog.create([{
      ...logEntry,
      status: 'ROLLED_BACK',
      reason: err.message
    }]).catch(() => {}); // don't fail if logging itself errors

    console.error('[TRANSACTION ROLLBACK]', err.message);
    res.status(500).json({
      message: 'Transaction failed and was rolled back',
      error: err.message
    });
  } finally {
    session.endSession();
  }
});

// ─── GET /api/transactions/history ────────────────────────────────────────────
// Returns all transactions involving the logged-in user's account
router.get('/history', async (req, res) => {
  try {
    const user = await User.findById(req.user.id);
    if (!user) return res.status(404).json({ message: 'User not found' });

    const logs = await TransactionLog.find({
      $or: [
        { fromAccount: user.accountNumber },
        { toAccount: user.accountNumber }
      ]
    }).sort({ createdAt: -1 }).limit(50);

    res.json({
      accountNumber: user.accountNumber,
      transactionCount: logs.length,
      transactions: logs
    });
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});

// ─── GET /api/transactions/balance ────────────────────────────────────────────
router.get('/balance', async (req, res) => {
  try {
    const user = await User.findById(req.user.id).select('-password');
    if (!user) return res.status(404).json({ message: 'User not found' });

    res.json({
      name: user.name,
      accountNumber: user.accountNumber,
      balance: user.balance
    });
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});

// ─── POST /api/transactions/deposit ───────────────────────────────────────────
// Seed/top-up route for testing — no session needed for single-document update
router.post('/deposit', async (req, res) => {
  try {
    const { amount } = req.body;
    if (!amount || amount <= 0) {
      return res.status(400).json({ message: 'Amount must be positive' });
    }

    const user = await User.findByIdAndUpdate(
      req.user.id,
      { $inc: { balance: amount } },
      { new: true }
    );

    res.json({
      message: `Deposited Rs.${amount}`,
      newBalance: user.balance,
      accountNumber: user.accountNumber
    });
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});

// ─── GET /api/transactions/logs ───────────────────────────────────────────────
// Admin view: all transaction logs (useful for auditing)
router.get('/logs', async (req, res) => {
  try {
    const logs = await TransactionLog.find().sort({ createdAt: -1 }).limit(100);
    res.json({ total: logs.length, logs });
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});

module.exports = router;
