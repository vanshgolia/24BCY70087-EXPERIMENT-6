const mongoose = require('mongoose');

/**
 * TransactionLog — Audit trail for every attempted transfer.
 * Records both successful transfers and failures with reason.
 */
const transactionLogSchema = new mongoose.Schema(
  {
    transactionId: {
      type: String,
      required: true,
      unique: true,
      default: () => 'TXN' + Date.now() + Math.floor(Math.random() * 10000)
    },
    fromAccount: { type: String, required: true },
    toAccount: { type: String, required: true },
    amount: { type: Number, required: true },
    status: {
      type: String,
      enum: ['SUCCESS', 'FAILED', 'ROLLED_BACK'],
      required: true
    },
    reason: { type: String }, // populated on failure / rollback
    fromBalanceBefore: { type: Number },
    fromBalanceAfter: { type: Number },
    toBalanceBefore: { type: Number },
    toBalanceAfter: { type: Number },
    initiatedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }
  },
  { timestamps: true }
);

module.exports = mongoose.model('TransactionLog', transactionLogSchema);
