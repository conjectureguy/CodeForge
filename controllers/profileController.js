// controllers/profileController.js
const Contest = require('../models/Contest');

exports.getProfile = async (req, res) => {
  try {
    // Fetch contests where the current user is a participant
    const contests = await Contest.find({ participants: req.user._id });
    res.render('profile', { user: req.user, contests });
  } catch (error) {
    res.status(500).send('Server Error');
  }
};
