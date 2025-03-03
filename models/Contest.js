const mongoose = require('mongoose');

const ProblemSchema = new mongoose.Schema({
  contestLink: { type: String, required: true },
  contestId: { type: String },
  problemIndex: { type: String },
  rating: { type: Number },
});

const ParticipantSchema = new mongoose.Schema({
  username: { type: String, required: true },
  submissions: [
    {
      problemId: { type: mongoose.Schema.Types.ObjectId },
      solved: { type: Boolean, default: false },
      wrongSubmissions: { type: Number, default: 0 },
      solvedTime: { type: Number }, // in minutes from contest start
    },
  ],
});

const ContestSchema = new mongoose.Schema({
  name: { type: String, required: true },
  // Remove privacy field.
  // Unique contest link slug generated upon creation.
  slug: { type: String, unique: true, index: true },
  startTime: { type: Date, required: true },
  duration: { type: Number, required: true }, // in minutes
  admin: { type: String, required: true },
  problems: [ProblemSchema],
  participants: [ParticipantSchema],
  createdAt: { type: Date, default: Date.now },
});

module.exports = mongoose.model('Contest', ContestSchema);
