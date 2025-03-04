// routes/contest.js
const express = require('express');
const router = express.Router();
const axios = require('axios');
const Contest = require('../models/Contest');
const Team = require('../models/Team'); // In case you need to use it for team creation/lookup

// 1. Create a new custom contest
router.post('/create', async (req, res) => {
  try {
    const { name, startTime, duration, admin, problems } = req.body;
    if (!name || !startTime || !duration || !admin) {
      return res.status(400).json({ error: 'Missing required fields.' });
    }
    // Initialize the contest with the admin as an individual participant
    const contest = new Contest({
      name,
      startTime: new Date(startTime),
      duration,
      admin,
      problems: problems || [],
      participants: [
        {
          isTeam: false,
          username: admin,
          submissions: [],
        },
      ],
    });
    await contest.save();

    // Generate a unique slug, e.g. "contest-<id>"
    contest.slug = `contest-${contest._id}`;
    await contest.save();

    res.json({ success: true, contestId: contest._id, contestLink: contest.slug });
  } catch (error) {
    console.error('Error creating contest:', error);
    res.status(500).json({ error: error.message });
  }
});

// 2. Add a problem manually
router.post('/:contestId/add-problem', async (req, res) => {
  try {
    const { contestId } = req.params;
    const { problemLink } = req.body;
    const parts = problemLink.split('/');
    const contestCode = parts[4];
    const problemIndex = parts[6];

    const contest = await Contest.findById(contestId);
    if (!contest) {
      return res.status(404).json({ error: 'Contest not found' });
    }
    // Enforce max 26 problems
    if (contest.problems.length >= 26) {
      return res.status(400).json({ error: 'Cannot add more than 26 problems.' });
    }

    const problemObj = {
      contestLink: problemLink,
      contestId: contestCode,
      problemIndex,
      rating: null,
    };
    contest.problems.push(problemObj);
    await contest.save();

    res.json({ success: true, contest });
  } catch (error) {
    console.error('Error adding problem:', error);
    res.status(500).json({ error: error.message });
  }
});

// 3. Add a random problem by rating
router.post('/:contestId/add-random', async (req, res) => {
  try {
    const { contestId } = req.params;
    const { rating } = req.body;
    const contest = await Contest.findById(contestId);
    if (!contest) {
      return res.status(404).json({ error: 'Contest not found' });
    }
    if (contest.problems.length >= 26) {
      return res.status(400).json({ error: 'Cannot add more than 26 problems.' });
    }

    const response = await axios.get('https://codeforces.com/api/problemset.problems');
    if (response.data.status !== 'OK') {
      throw new Error('Error fetching problemset');
    }
    const allProblems = response.data.result.problems;
    const matching = allProblems.filter((p) => p.rating === rating);
    if (matching.length === 0) {
      return res.status(400).json({ error: 'No problem found for given rating' });
    }
    const randomProblem = matching[Math.floor(Math.random() * matching.length)];
    const probLink = `https://codeforces.com/contest/${randomProblem.contestId}/problem/${randomProblem.index}`;
    const problemObj = {
      contestLink: probLink,
      contestId: randomProblem.contestId,
      problemIndex: randomProblem.index,
      rating,
    };
    contest.problems.push(problemObj);
    await contest.save();

    res.json({ success: true, contest });
  } catch (error) {
    console.error('Error adding random problem:', error);
    res.status(500).json({ error: error.message });
  }
});

// 4. Join as an individual
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

    // Check if user is already added as individual
    const existing = contest.participants.find(
      (p) => p.isTeam === false && p.username === username
    );
    if (!existing) {
      contest.participants.push({
        isTeam: false,
        username,
        submissions: [],
      });
      await contest.save();
    }
    res.json({ success: true, message: 'Joined contest successfully', contest });
  } catch (error) {
    console.error('Error joining contest (individual):', error);
    res.status(500).json({ error: error.message });
  }
});

// 5. Join as a team
router.post('/:contestId/join-team', async (req, res) => {
  try {
    const { contestId } = req.params;
    const { teamName, members } = req.body;
    if (!teamName) {
      return res.status(400).json({ error: 'Team name is required.' });
    }

    let finalMembers = [];
    if (members) {
      // If members are provided, we create a new team
      if (!Array.isArray(members)) {
        return res.status(400).json({ error: 'Members must be provided as an array.' });
      }
      const filteredMembers = members.filter((m) => m && m.trim() !== '');
      if (filteredMembers.length < 1 || filteredMembers.length > 3) {
        return res.status(400).json({ error: 'Team name + 1–3 members required.' });
      }
      // Create a new team
      const newTeam = new Team({ teamName, members: filteredMembers });
      await newTeam.save();
      finalMembers = filteredMembers;
    } else {
      // If no members, find existing team by teamName
      const existingTeam = await Team.findOne({ teamName });
      if (!existingTeam) {
        return res
          .status(400)
          .json({ error: 'Team not found. Please create your team first.' });
      }
      finalMembers = existingTeam.members;
    }

    const contest = await Contest.findById(contestId);
    if (!contest) {
      return res.status(404).json({ error: 'Contest not found' });
    }

    // If this team is not already in participants, add it
    const existing = contest.participants.find(
      (p) => p.isTeam && p.teamName === teamName
    );
    if (!existing) {
      contest.participants.push({
        isTeam: true,
        teamName,
        members: finalMembers,
        submissions: [],
      });
      await contest.save();
    }

    // If any of these members are also in the participant list as individuals, remove them
    // e.g., if admin or any user is also an individual
    const updatedParticipants = contest.participants.filter((p) => {
      if (p.isTeam) return true; // keep all teams
      // Exclude an individual if they are in finalMembers
      if (!p.isTeam && finalMembers.includes(p.username)) {
        return false;
      }
      return true;
    });
    contest.participants = updatedParticipants;
    await contest.save();

    res.json({ success: true, message: 'Team joined contest successfully', contest });
  } catch (error) {
    console.error('Error joining as team:', error);
    res.status(500).json({ error: error.message });
  }
});

// 6. Get contest details by slug
router.get('/slug/:slug', async (req, res) => {
  try {
    const { slug } = req.params;
    const contest = await Contest.findOne({ slug });
    if (!contest) {
      return res
        .status(404)
        .json({ success: false, error: 'Contest not found' });
    }
    res.json({ success: true, contest });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// 7. Get leaderboard by slug
// If a user is in a team, do NOT display them individually.
router.get('/slug/:slug/leaderboard', async (req, res) => {
  try {
    const { slug } = req.params;
    const contest = await Contest.findOne({ slug });
    if (!contest) {
      return res
        .status(404)
        .json({ success: false, error: 'Contest not found' });
    }

    const contestStart = new Date(contest.startTime);
    const problems = contest.problems;

    // Build a set of usernames that are in any team.
    const usersInTeams = new Set();
    contest.participants.forEach((p) => {
      if (p.isTeam && p.members) {
        p.members.forEach((m) => usersInTeams.add(m));
      }
    });

    // finalParticipants: keep teams; exclude any user who is in a team
    const finalParticipants = contest.participants.filter((p) => {
      if (p.isTeam) return true; // keep all teams
      if (!p.isTeam && usersInTeams.has(p.username)) return false; // remove user in a team
      return true;
    });

    // Dummy scoreboard logic
    const leaderboard = [];
    for (const participant of finalParticipants) {
      let solvedCount = 0;
      let totalPenalty = 0;
      leaderboard.push({
        isTeam: participant.isTeam,
        username: participant.username || '',
        teamName: participant.teamName || '',
        members: participant.members || [],
        solvedCount,
        penalty: totalPenalty,
      });
    }

    // Sort by solvedCount desc, penalty asc
    leaderboard.sort((a, b) => {
      if (b.solvedCount !== a.solvedCount) return b.solvedCount - a.solvedCount;
      return a.penalty - b.penalty;
    });

    res.json({ success: true, leaderboard });
  } catch (error) {
    console.error('Error fetching leaderboard:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

module.exports = router;
