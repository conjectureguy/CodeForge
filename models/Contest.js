// models/Contest.js
const mongoose = require('mongoose');

const ContestSchema = new mongoose.Schema({
  title: { type: String, required: true },
  // List of CodeForces problem identifiers (e.g., "123A")
  problems: [{ type: String, required: true }],
  // Participants (references to User documents)
  participants: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  // A simple analytics object – extend with more fields as needed
  analytics: {
    averageScore: { type: Number, default: 0 },
    totalSubmissions: { type: Number, default: 0 }
  },
  createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Contest', ContestSchema);
