// src/components/ContestDetailPage.js
import React, { useState, useEffect } from 'react';
import { Alert, Spinner, Table, Button } from 'react-bootstrap';
import axios from 'axios';
import { useParams } from 'react-router-dom';

function ContestDetailPage() {
  const { contestSlug } = useParams(); // e.g., "contest-<id>"
  const [contest, setContest] = useState(null);
  const [leaderboard, setLeaderboard] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // 1. Fetch the contest details from our backend slug endpoint
  const fetchContest = async () => {
    setLoading(true);
    try {
      const res = await axios.get(`http://localhost:5000/api/contests/slug/${contestSlug}`);
      if (res.data.success) {
        setContest(res.data.contest);
      } else {
        setError('Contest not found');
      }
    } catch (err) {
      setError('Error fetching contest');
    }
    setLoading(false);
  };

  // 2. Refresh the leaderboard by checking each participant's last 50 submissions
  //    If participant.isTeam is true, we fetch last 50 for each member and combine them.
  const refreshLeaderboard = async () => {
    if (!contest) return;
    const newLeaderboard = [];

    console.log('Contest data:', contest);
    

    for (const participant of contest.participants) {
      // We'll gather all submissions for this participant (or team) into a single array
      let allSubs = [];
      let displayName = '';
      if (participant.isTeam) {
        // If it's a team, fetch last 50 submissions for each member
        displayName = `${participant.teamName} [${(participant.members || []).join(', ')}]`;
        for (const member of participant.members) {
          try {
            const subRes = await axios.get(`https://codeforces.com/api/user.status?handle=${member}&count=50`);
            const submissions = subRes.data.result || [];
            console.log(`Last 50 submissions for team member ${member}:`, submissions);
            allSubs = allSubs.concat(submissions);
          } catch (err) {
            console.error(`Error fetching submissions for team member ${member}:`, err);
          }
        }
      } else {
        // Individual participant
        displayName = participant.username;
        try {
          const subRes = await axios.get(
            `https://codeforces.com/api/user.status?handle=${participant.username}&count=50`
          );
          const submissions = subRes.data.result || [];
          console.log(`Last 50 submissions for user ${participant.username}:`, submissions);
          allSubs = submissions;
        } catch (err) {
          console.error(`Error fetching submissions for ${participant.username}:`, err);
        }
      }

      // Now compute solvedCount and penalty from allSubs
      let solvedCount = 0;
      let totalPenalty = 0;

      try {
        // For each problem in the contest, find earliest accepted submission in allSubs
        for (const prob of contest.problems) {
          // Filter relevant subs for this problem
          const relevantSubs = allSubs.filter(sub =>
            sub.problem &&
            sub.problem.index === prob.problemIndex &&
            sub.problem.contestId &&
            sub.problem.contestId.toString() === prob.contestId.toString() &&
            new Date(sub.creationTimeSeconds * 1000) >= new Date(contest.startTime)
          );
          if (relevantSubs.length > 0) {
            // Check if there's an accepted submission
            const acceptedSubs = relevantSubs.filter(sub => sub.verdict === 'OK');
            if (acceptedSubs.length > 0) {
              acceptedSubs.sort((a, b) => a.creationTimeSeconds - b.creationTimeSeconds);
              const firstAccepted = acceptedSubs[0];
              // Compute solved time
              const solvedTime = Math.floor(
                (firstAccepted.creationTimeSeconds * 1000 - new Date(contest.startTime).getTime()) / 60000
              );
              // Count wrong attempts before first accepted
              const wrongAttempts = relevantSubs.filter(
                sub => sub.creationTimeSeconds < firstAccepted.creationTimeSeconds && sub.verdict !== 'OK'
              ).length;
              solvedCount += 1;
              totalPenalty += solvedTime + wrongAttempts * 10;
            }
          }
        }
      } catch (err) {
        console.error('Error computing scoreboard for participant:', err);
      }

      newLeaderboard.push({
        displayName,
        solvedCount,
        penalty: totalPenalty,
      });
    }

    // Sort leaderboard: first by solvedCount desc, then penalty asc
    newLeaderboard.sort((a, b) => {
      if (b.solvedCount !== a.solvedCount) return b.solvedCount - a.solvedCount;
      return a.penalty - b.penalty;
    });

    setLeaderboard(newLeaderboard);
  };

  // On mount, fetch contest details (once) then optional initial refresh
  useEffect(() => {
    fetchContest();
  }, [contestSlug]);

  if (loading) return <Spinner animation="border" variant="primary" />;
  if (error) return <Alert variant="danger">{error}</Alert>;
  if (!contest) return null;

  const contestStarted = new Date() >= new Date(contest.startTime);

  return (
    <div>
      <h2>{contest.name}</h2>
      <p>
        Start Time: {new Date(contest.startTime).toLocaleString()} | Duration: {contest.duration} minutes
      </p>
      {!contestStarted ? (
        <Alert variant="info">Contest has not started yet.</Alert>
      ) : (
        <>
          <h3>Problems</h3>
          <ul>
            {contest.problems.map((p, idx) => (
              <li key={idx}>
                <a href={p.contestLink} target="_blank" rel="noopener noreferrer">
                  {p.contestLink}
                </a> ({p.problemIndex})
              </li>
            ))}
          </ul>

          <h3>Leaderboard (ICPC Style)</h3>
          <Button variant="primary" className="mb-3" onClick={refreshLeaderboard}>
            Refresh Leaderboard
          </Button>
          <Table striped bordered hover responsive>
            <thead>
              <tr>
                <th>Rank</th>
                <th>Team / User</th>
                <th>Solved</th>
                <th>Penalty</th>
              </tr>
            </thead>
            <tbody>
              {leaderboard.length > 0 ? (
                leaderboard.map((row, idx) => (

                  <tr key={idx}>
                    <td>{idx + 1}</td>
                    <td>{row.displayName}</td>
                    <td>{row.solvedCount}</td>
                    <td>{row.penalty}</td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="4" className="text-center">
                    No submissions yet. Click "Refresh Leaderboard" to update.
                  </td>
                </tr>
              )}
            </tbody>
          </Table>
        </>
      )}
    </div>
  );
}

export default ContestDetailPage;
