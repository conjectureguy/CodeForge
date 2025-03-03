// src/components/ContestDetailPage.js
import React, { useState, useEffect } from 'react';
import { Alert, Spinner, Table, Button } from 'react-bootstrap';
import axios from 'axios';
import { useParams } from 'react-router-dom';

function ContestDetailPage() {
  const { contestSlug } = useParams(); // Expected format: "contest-<id>"
  const [contest, setContest] = useState(null);
  const [leaderboard, setLeaderboard] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Fetch contest details using our slug endpoint
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

  // Refresh leaderboard by fetching the last 50 submissions for each participant,
  // then running nested loops over contest problems and submissions.
  const refreshLeaderboard = async () => {
    if (!contest) return;
    const newLeaderboard = [];
    console.log(contest);
    for (const participant of contest.participants) {
      let solvedCount = 0;
      let totalPenalty = 0;
      try {
        // Fetch last 50 submissions for this participant
        const subRes = await axios.get(`https://codeforces.com/api/user.status?handle=${participant.username}&count=50`);
        const submissions = subRes.data.result;
        console.log(`Last 50 submissions for ${participant.username}:`, submissions);
        // For each contest problem, check if there is an accepted submission
        for (const prob of contest.problems) {
          // Filter submissions for this problem (match contestId and problem index)
          const relevantSubs = submissions.filter(sub =>
            sub.problem &&
            sub.problem.index === prob.problemIndex &&
            sub.problem.contestId.toString() === prob.contestId.toString() &&
            new Date(sub.creationTimeSeconds * 1000) >= new Date(contest.startTime)
          );
          if (relevantSubs.length > 0) {
            // Find the first accepted submission for this problem (if any)
            const acceptedSubs = relevantSubs.filter(sub => sub.verdict === 'OK');
            if (acceptedSubs.length > 0) {
              acceptedSubs.sort((a, b) => a.creationTimeSeconds - b.creationTimeSeconds);
              const firstAccepted = acceptedSubs[0];
              // Calculate solved time in minutes from contest start
              const solvedTime = Math.floor(
                (firstAccepted.creationTimeSeconds * 1000 - new Date(contest.startTime).getTime()) / 60000
              );
              // Count wrong attempts before the first accepted submission
              const wrongAttempts = relevantSubs.filter(
                sub => sub.creationTimeSeconds < firstAccepted.creationTimeSeconds && sub.verdict !== 'OK'
              ).length;
              solvedCount += 1;
              totalPenalty += solvedTime + wrongAttempts * 10;
            }
          }
        }
      } catch (err) {
        console.error(`Error fetching submissions for ${participant.username}:`, err);
      }
      newLeaderboard.push({ username: participant.username, solvedCount, penalty: totalPenalty });
    }
    // Sort leaderboard: first by solved count (desc), then by penalty (asc)
    newLeaderboard.sort((a, b) => {
      if (b.solvedCount !== a.solvedCount) return b.solvedCount - a.solvedCount;
      return a.penalty - b.penalty;
    });
    setLeaderboard(newLeaderboard);
  };

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
                </a>
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
                <th>Username</th>
                <th>Solved</th>
                <th>Penalty</th>
              </tr>
            </thead>
            <tbody>
              {leaderboard.length > 0 ? (
                leaderboard.map((row, idx) => (
                  <tr key={idx}>
                    <td>{idx + 1}</td>
                    <td>{row.username}</td>
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
