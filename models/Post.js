const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const ReplySchema = new Schema({
  author: { type: String, required: true },
  content: { type: String, required: true },
  votes: { type: Number, default: 0 },
  createdAt: { type: Date, default: Date.now },
  replies: [] // this will be filled recursively below
});

// Allow nested replies recursively
ReplySchema.add({ replies: [ReplySchema] });

const PostSchema = new Schema({
  title: { type: String, required: true },
  content: { type: String, required: true },
  author: { type: String, required: true },
  votes: { type: Number, default: 0 },
  createdAt: { type: Date, default: Date.now },
  replies: [ReplySchema]
});

module.exports = mongoose.model('Post', PostSchema);
