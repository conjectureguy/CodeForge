const express = require('express');
const router = express.Router();
const Post = require('../models/Post');

// GET: Fetch all posts (sorted by newest)
router.get('/posts', async (req, res) => {
  try {
    const posts = await Post.find().sort({ createdAt: -1 });
    res.json(posts);
  } catch (error) {
    res.status(500).json({ error: 'Error fetching posts' });
  }
});

// POST: Create a new post
router.post('/posts', async (req, res) => {
  const { title, content, author } = req.body;
  try {
    const newPost = new Post({ title, content, author });
    await newPost.save();
    // Emit a real-time event if Socket.io is available
    const io = req.app.get('io');
    if (io) io.emit('postCreated', newPost);
    res.status(201).json(newPost);
  } catch (error) {
    res.status(500).json({ error: 'Error creating post' });
  }
});

// POST: Vote on a post (expects { type: 'up' } or { type: 'down' })
router.post('/posts/:postId/vote', async (req, res) => {
  const { postId } = req.params;
  const { type } = req.body;
  try {
    const post = await Post.findById(postId);
    if (!post) return res.status(404).json({ error: 'Post not found' });
    if (type === 'up') {
      post.votes += 1;
    } else if (type === 'down') {
      post.votes -= 1;
    } else {
      return res.status(400).json({ error: 'Invalid vote type' });
    }
    await post.save();
    const io = req.app.get('io');
    if (io) io.emit('postUpdated', post);
    res.json(post);
  } catch (error) {
    res.status(500).json({ error: 'Error updating vote' });
  }
});

// Helper: Recursively add a reply to a reply array
async function addReply(replies, parentId, newReply) {
  for (let reply of replies) {
    if (reply._id.toString() === parentId) {
      reply.replies.push(newReply);
      return true;
    } else if (reply.replies && reply.replies.length) {
      const found = await addReply(reply.replies, parentId, newReply);
      if (found) return true;
    }
  }
  return false;
}

// POST: Add a reply to a post (or nested reply if parentReplyId is provided)
router.post('/posts/:postId/reply', async (req, res) => {
  const { postId } = req.params;
  const { author, content, parentReplyId } = req.body;
  try {
    const post = await Post.findById(postId);
    if (!post) return res.status(404).json({ error: 'Post not found' });
    
    const newReply = {
      author,
      content,
      votes: 0,
      createdAt: new Date(),
      replies: []
    };
    
    if (parentReplyId) {
      // Add as nested reply
      const found = await addReply(post.replies, parentReplyId, newReply);
      if (!found) {
        return res.status(404).json({ error: 'Parent reply not found' });
      }
    } else {
      // Add as top-level reply
      post.replies.push(newReply);
    }
    
    await post.save();
    const io = req.app.get('io');
    if (io) io.emit('postUpdated', post);
    res.json(post);
  } catch (error) {
    res.status(500).json({ error: 'Error adding reply' });
  }
});

module.exports = router;
