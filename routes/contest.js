// routes/contest.js
const express = require('express');
const router = express.Router();
const contestController = require('../controllers/contestController');
// Ensure users are authenticated before accessing these endpoints
const { ensureAuthenticated } = require('../middleware/auth');

router.post('/create', ensureAuthenticated, contestController.createContest);
router.post('/:contestId/join', ensureAuthenticated, contestController.joinContest);
router.get('/my-contests', ensureAuthenticated, contestController.getUserContestAnalytics);

module.exports = router;
