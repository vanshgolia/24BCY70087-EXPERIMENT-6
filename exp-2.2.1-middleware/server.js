require('dotenv').config();
const express = require('express');
const connectDB = require('./config/db');
const logger = require('./middleware/logger');
const errorHandler = require('./middleware/errorHandler');
const publicRoutes = require('./routes/public');
const protectedRoutes = require('./routes/protected');

const app = express();

// ─── Connect to MongoDB ────────────────────────────────────────────────────────
connectDB();

// ─── Built-in Middleware ───────────────────────────────────────────────────────
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// ─── Custom Logging Middleware (applied globally) ──────────────────────────────
app.use(logger);

// ─── Routes ───────────────────────────────────────────────────────────────────
app.use('/api/public', publicRoutes);
app.use('/api/protected', protectedRoutes); // auth middleware applied inside

// ─── 404 Handler ──────────────────────────────────────────────────────────────
app.use((req, res, next) => {
  res.status(404).json({ success: false, message: `Route ${req.originalUrl} not found` });
});

// ─── Global Error Handler (must be last) ──────────────────────────────────────
app.use(errorHandler);

// ─── Start Server ─────────────────────────────────────────────────────────────
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`\n🚀 Experiment 2.2.1 — Middleware Demo`);
  console.log(`   Server running on http://localhost:${PORT}`);
  console.log(`\n📋 Available Routes:`);
  console.log(`   GET  /api/public/health       — Health check (public)`);
  console.log(`   POST /api/public/login        — Get a demo JWT (use test@bank.com / password123)`);
  console.log(`   GET  /api/public/error        — Trigger error middleware`);
  console.log(`   GET  /api/protected/dashboard — Protected (JWT required)`);
  console.log(`   GET  /api/protected/profile   — Protected (JWT required)`);
  console.log(`   GET  /api/protected/admin     — Protected (JWT required)\n`);
});
