require('dotenv').config();
const express = require('express');
const connectDB = require('./config/db');
const authRoutes = require('./routes/auth');
const bankingRoutes = require('./routes/banking');

const app = express();

// ─── Connect to MongoDB ────────────────────────────────────────────────────────
connectDB();

// ─── Middleware ────────────────────────────────────────────────────────────────
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// ─── Routes ───────────────────────────────────────────────────────────────────
app.use('/api/auth', authRoutes);
app.use('/api/banking', bankingRoutes); // all protected by verifyToken inside

// ─── 404 Handler ──────────────────────────────────────────────────────────────
app.use((req, res) => {
  res.status(404).json({ message: `Route ${req.originalUrl} not found` });
});

// ─── Global Error Handler ─────────────────────────────────────────────────────
app.use((err, req, res, next) => {
  console.error('[ERROR]', err.stack);
  res.status(err.status || 500).json({ message: err.message || 'Internal Server Error' });
});

// ─── Start Server ─────────────────────────────────────────────────────────────
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`\n🚀 Experiment 2.2.2 — JWT Banking API`);
  console.log(`   Server running on http://localhost:${PORT}`);
  console.log(`\n📋 Auth Routes:`);
  console.log(`   POST /api/auth/register   — Register new user`);
  console.log(`   POST /api/auth/login      — Login & get tokens`);
  console.log(`   POST /api/auth/refresh    — Refresh access token`);
  console.log(`   POST /api/auth/logout     — Invalidate refresh token`);
  console.log(`\n🔒 Protected Banking Routes (JWT required):`);
  console.log(`   GET  /api/banking/balance  — Check balance`);
  console.log(`   POST /api/banking/deposit  — Deposit money`);
  console.log(`   POST /api/banking/withdraw — Withdraw money\n`);
});
