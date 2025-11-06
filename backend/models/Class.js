const mongoose = require('mongoose');

const classSchema = new mongoose.Schema({
  name: { type: String, required: true },
  code: { type: String, required: true, unique: true },
  facultyId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  students: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
  schedule: {
    day: String,
    time: String
  },
  createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Class', classSchema);

