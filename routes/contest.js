// routes/contest.js
const express = require('express');
const router = express.Router();
const axios = require('axios');
const Contest = require('../models/Contest');

/**
 * ORDER MATTERS:
 *  1) Slug-based routes
 *  2) ID-based routes
 */

// --------------------------------------------------------------------------
// 1) SLUG-BASED ROUTES
// --------------------------------------------------------------------------

// GET /api/contests/slug/:slug
// Fetch a contest by its slug (e.g. "contest-<objectId>")
// Get contest leaderboard by slug with dynamic Codeforces fetch
// Get contest leaderboard by slug, fetching last 50 submissions from Codeforces
router.get('/slug/:slug/leaderboard', async (req, res) => {
  try {
    const { slug } = req.params;
    const contest = await Contest.findOne({ slug });
    if (!contest) {
      return res.status(404).json({ success: false, error: 'Contest not found' });
    }

    const contestStart = new Date(contest.startTime);
    const problems = contest.problems;
    const leaderboard = [];

    // For each participant, gather solvedCount & penalty
    for (const participant of contest.participants) {
      const username = participant.username;
      let solvedCount = 0;
      let totalPenalty = 0;

      for (const prob of problems) {
        // For each problem, fetch the last 50 submissions from CF
        // The Codeforces API returns newest -> oldest.
        const apiUrl = `https://codeforces.com/api/user.status?handle=${username}&count=50`;
        try {
          const response = await axios.get(apiUrl);
          if (response.data.status !== 'OK') {
            // If we can't fetch data, skip
            continue;
          }
          const submissions = response.data.result;

          // Filter submissions for this problem index AND after contestStart
          const relevantSubs = submissions.filter(sub =>
            sub.problem &&
            sub.problem.index === prob.problemIndex &&
            new Date(sub.creationTimeSeconds * 1000) >= contestStart
          );
          if (relevantSubs.length === 0) {
            continue;
          }

          // Check if there's an accepted submission
          const acceptedSubs = relevantSubs.filter(sub => sub.verdict === 'OK');
          if (acceptedSubs.length > 0) {
            // Sort accepted subs by time ascending to find the first accepted
            acceptedSubs.sort((a, b) => a.creationTimeSeconds - b.creationTimeSeconds);
            const firstAccepted = acceptedSubs[0];
            // Compute solvedTime in minutes from contest start
            const solvedTime = Math.floor(
              (firstAccepted.creationTimeSeconds * 1000 - contestStart.getTime()) / 60000
            );
            // Count how many attempts were wrong before the first accepted
            const wrongAttempts = relevantSubs.filter(
              sub =>
                sub.creationTimeSeconds < firstAccepted.creationTimeSeconds &&
                sub.verdict !== 'OK'
            ).length;
            solvedCount += 1;
            totalPenalty += solvedTime + wrongAttempts * 10;
          }
        } catch (err) {
          // If an error occurs for this participant/problem, just skip
          console.error(`Error fetching last 50 submissions for ${username}, problem ${prob.problemIndex}`, err);
        }
      }

      leaderboard.push({ username, solvedCount, penalty: totalPenalty });
    }

    // Sort leaderboard by solvedCount desc, then penalty asc
    leaderboard.sort((a, b) => {
      if (b.solvedCount !== a.solvedCount) return b.solvedCount - a.solvedCount;
      return a.penalty - b.penalty;
    });

    return res.json({ success: true, leaderboard });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ success: false, error: error.message });
  }
});



// --------------------------------------------------------------------------
// 2) ID-BASED ROUTES
// --------------------------------------------------------------------------

// POST /api/contests/create
// Create a new custom contest

// Get contest details by slug
router.get('/slug/:slug', async (req, res) => {
  try {
    const { slug } = req.params;
    const contest = await Contest.findOne({ slug });
    if (!contest) return res.status(404).json({ success: false, error: 'Contest not found' });
    res.json({ success: true, contest });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});


// Create a new custom contest and add the admin to the participants list
router.post('/create', async (req, res) => {
  try {
    const { name, startTime, duration, admin, problems } = req.body;
    // Validate required fields
    if (!name || !startTime || !duration || !admin) {
      return res.status(400).json({ 
        success: false, 
        error: 'Missing required fields: name, startTime, duration, and admin are required.' 
      });
    }
    console.log('Creating contest with admin:', admin);
    // Create the contest and add the admin to the participants list
    const contest = new Contest({
      name,
      startTime: new Date(startTime),
      duration,
      admin,
      problems: problems || [],
      participants: [{ username: admin, submissions: [] }],
    });
    await contest.save();
    // Generate a unique slug for the contest (e.g., "contest-<contestId>")
    contest.slug = `contest-${contest._id}`;
    await contest.save();
    res.json({ success: true, contestId: contest._id, contestLink: contest.slug });
  } catch (error) {
    console.error('Error creating contest:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});



// POST /api/contests/:contestId/add-problem
// Add a problem manually to an existing contest
router.post('/:contestId/add-problem', async (req, res) => {
  try {
    const { contestId } = req.params;
    const { problemLink } = req.body;
    const parts = problemLink.split('/');
    const contestCode = parts[4];
    const problemIndex = parts[6];
    const problemObj = {
      contestLink: problemLink,
      contestId: contestCode,
      problemIndex,
      rating: null,
    };
    const contest = await Contest.findByIdAndUpdate(
      contestId,
      { $push: { problems: problemObj } },
      { new: true }
    );
    res.json({ success: true, contest });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// POST /api/contests/:contestId/add-random
// Add a random problem (by rating) to a contest
router.post('/:contestId/add-random', async (req, res) => {
  try {
    const { contestId } = req.params;
    const { rating } = req.body;
    const response = await axios.get('https://codeforces.com/api/problemset.problems');
    if (response.data.status !== 'OK') {
      throw new Error('Error fetching problemset');
    }
    const allProblems = response.data.result.problems;
    const matching = allProblems.filter((p) => p.rating === rating);
    if (matching.length === 0) {
      return res.status(400).json({ success: false, error: 'No problem found for given rating' });
    }
    const randomProblem = matching[Math.floor(Math.random() * matching.length)];
    const problemLink = `https://codeforces.com/contest/${randomProblem.contestId}/problem/${randomProblem.index}`;
    const problemObj = {
      contestLink: problemLink,
      contestId: randomProblem.contestId,
      problemIndex: randomProblem.index,
      rating,
    };
    const contest = await Contest.findByIdAndUpdate(
      contestId,
      { $push: { problems: problemObj } },
      { new: true }
    );
    res.json({ success: true, contest });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// POST /api/contests/:contestId/join
// Join a contest using the contest's _id
// Updated Join Contest Endpoint
router.post('/:contestId/join', async (req, res) => {
  try {
    const { contestId } = req.params;
    const { username } = req.body;
    if (!username) {
      return res.status(400).json({ error: 'Username required' });
    }
    const contest = await Contest.findById(contestId);
    if (!contest) {
      return res.status(404).json({ error: 'Contest not found' });
    }
    // Ensure we add a participant with an empty submissions array
    const existing = contest.participants.find(p => p.username === username);
    if (!existing) {
      contest.participants.push({ username, submissions: [] });
      await contest.save();
    }
    res.json({ success: true, message: 'Joined contest successfully', contest });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});


// GET /api/contests/:contestId
// (Optionally, fetch a contest by its _id)
router.get('/:contestId', async (req, res) => {
  try {
    const { contestId } = req.params;
    const contest = await Contest.findById(contestId);
    if (!contest) return res.status(404).json({ success: false, error: 'Contest not found by ID' });
    res.json({ success: true, contest });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// GET /api/contests
// List all contests
router.get('/', async (req, res) => {
  try {
    const contests = await Contest.find();
    res.json({ success: true, contests });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

module.exports = router;
