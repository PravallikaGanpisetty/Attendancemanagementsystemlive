const mongoose = require('mongoose');

const attendanceSchema = new mongoose.Schema({
  classId: { type: mongoose.Schema.Types.ObjectId, ref: 'Class', required: true },
  studentId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  date: { type: Date, required: true },
  status: { type: String, enum: ['present', 'absent', 'late'], default: 'absent' },
  markedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  remarks: String,
  createdAt: { type: Date, default: Date.now }
});

// Compound index to prevent duplicate attendance entries
attendanceSchema.index({ classId: 1, studentId: 1, date: 1 }, { unique: true });

module.exports = mongoose.model('Attendance', attendanceSchema);

