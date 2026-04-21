const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    email: { type: String, required: true, unique: true, lowercase: true },
    password: { type: String, required: true, minlength: 6 },
    accountNumber: { type: String, unique: true },
    balance: { type: Number, default: 0 },
    refreshToken: { type: String }
  },
  { timestamps: true }
);

// Pre-save hook: hash password and generate account number
// Note: Mongoose v7+ pre('save') does NOT use a next() parameter
userSchema.pre('save', async function () {
  if (this.isModified('password')) {
    const salt = await bcrypt.genSalt(12); // cost factor 12 = 2^12 = 4096 iterations
    this.password = await bcrypt.hash(this.password, salt);
  }
  if (!this.accountNumber) {
    this.accountNumber = 'ACC' + Date.now();
  }
});

// Instance method to compare passwords
userSchema.methods.comparePassword = async function (candidatePassword) {
  return bcrypt.compare(candidatePassword, this.password);
};

module.exports = mongoose.model('User', userSchema);
