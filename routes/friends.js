const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const User = require('../models/User');

// Get all friends for the logged-in user
router.get('/', auth, async (req, res) => {
  try {
    const user = await User.findById(req.user.id).select('friends');
    if (!user) {
      return res.status(404).json({ msg: 'User not found' });
    }
    res.json(user.friends);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
});

// Add a friend to the logged-in user's friend list
router.post('/add', auth, async (req, res) => {
  try {
    const { friendHandle } = req.body;
    
    if (!friendHandle) {
      return res.status(400).json({ msg: 'Friend handle is required' });
    }

    const user = await User.findById(req.user.id);
    if (!user) {
      return res.status(404).json({ msg: 'User not found' });
    }
    
    // Check if friend already exists
    if (user.friends.includes(friendHandle)) {
      return res.status(400).json({ msg: 'Friend already added' });
    }

    // Add friend to user's friend list
    user.friends.push(friendHandle);
    await user.save();

    res.json(user.friends);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
});

// Remove a friend from the logged-in user's friend list
router.delete('/remove/:handle', auth, async (req, res) => {
  try {
    const friendHandle = req.params.handle;
    const user = await User.findById(req.user.id);
    if (!user) {
      return res.status(404).json({ msg: 'User not found' });
    }
    
    // Filter out the friend to remove
    user.friends = user.friends.filter(handle => handle !== friendHandle);
    await user.save();

    res.json(user.friends);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
});

module.exports = router;