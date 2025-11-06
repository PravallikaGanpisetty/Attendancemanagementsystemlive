const mongoose = require('mongoose');
const userSchema = new mongoose.Schema({
  name: { type: String, required: true },
  email: { type: String, required: true, lowercase: true },
  role: { type: String, enum: ['student','faculty','admin'], default: 'student', required: true },
  passwordHash: { type: String, required: true }
});

// Compound unique index for email + role combination
userSchema.index({ email: 1, role: 1 }, { unique: true });

module.exports = mongoose.model('User', userSchema);
