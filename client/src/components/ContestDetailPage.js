import React, { useState, useEffect } from 'react';
import { Alert, Spinner, Table, Button } from 'react-bootstrap';
import axios from 'axios';
import { useParams } from 'react-router-dom';

function ContestDetailPage() {
  const { contestSlug } = useParams();
  const [contest, setContest] = useState(null);
  const [leaderboard, setLeaderboard] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

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

  const refreshLeaderboard = async () => {
    if (!contest) return;
    const newLeaderboard = [];

    for (const participant of contest.participants) {
      let allSubs = [];
      let displayName = '';
      if (participant.isTeam) {
        displayName = `${participant.teamName} (${(participant.members || []).join(', ')})`;
        for (const member of participant.members) {
          try {
            const subRes = await axios.get(`https://codeforces.com/api/user.status?handle=${member}&count=50`);
            const submissions = subRes.data.result || [];
            allSubs = allSubs.concat(submissions);
          } catch (err) {
            console.error(`Error fetching submissions for team member ${member}:`, err);
          }
        }
      } else {
        displayName = participant.username;
        try {
          const subRes = await axios.get(
            `https://codeforces.com/api/user.status?handle=${participant.username}&count=50`
          );
          const submissions = subRes.data.result || [];
          allSubs = submissions;
        } catch (err) {
          console.error(`Error fetching submissions for ${participant.username}:`, err);
        }
      }

      let solvedCount = 0;
      let totalPenalty = 0;
      const problemStatus = {};

      try {
        for (const prob of contest.problems) {
          // Create a unique key combining contestId and problemIndex
          const problemKey = `${prob.contestId}-${prob.problemIndex}`;

          // Narrow down to submissions specific to this exact problem
          const relevantSubs = allSubs.filter(sub =>
            sub.problem &&
            sub.problem.index === prob.problemIndex &&
            sub.problem.contestId &&
            sub.problem.contestId.toString() === prob.contestId.toString() &&
            new Date(sub.creationTimeSeconds * 1000) >= new Date(contest.startTime)
          );

          const acceptedSubs = relevantSubs.filter(sub => 
            sub.verdict === 'OK' &&
            sub.problem.index === prob.problemIndex &&
            sub.problem.contestId.toString() === prob.contestId.toString()
          );

          if (acceptedSubs.length > 0) {
            // Sort accepted submissions to get the first one
            acceptedSubs.sort((a, b) => a.creationTimeSeconds - b.creationTimeSeconds);
            const firstAccepted = acceptedSubs[0];
            
            // Calculate solved time
            const solvedTime = Math.floor(
              (firstAccepted.creationTimeSeconds * 1000 - new Date(contest.startTime).getTime()) / 60000
            );

            // Count wrong attempts before the first accepted submission for THIS specific problem
            const wrongAttempts = relevantSubs.filter(
              sub => sub.creationTimeSeconds < firstAccepted.creationTimeSeconds && 
                     sub.verdict !== 'OK' &&
                     sub.problem.index === prob.problemIndex &&
                     sub.problem.contestId.toString() === prob.contestId.toString()
            ).length;

            problemStatus[problemKey] = {
              solved: true,
              attempts: wrongAttempts,
              time: solvedTime
            };
            solvedCount += 1;
            totalPenalty += solvedTime + wrongAttempts * 20;
          } else if (relevantSubs.filter(sub => sub.verdict !== 'OK').length > 0) {
            // Track unsolved problems with attempts
            problemStatus[problemKey] = {
              solved: false,
              attempts: relevantSubs.filter(sub => sub.verdict !== 'OK').length,
              time: 0
            };
          }
        }
      } catch (err) {
        console.error('Error computing scoreboard for participant:', err);
      }

      newLeaderboard.push({
        displayName,
        solvedCount,
        penalty: totalPenalty,
        problemStatus,
      });
    }
    
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
    <div className="container-fluid">
      <h2>{contest.name}</h2>
      <p>
        Start Time: {new Date(contest.startTime).toLocaleString()} | Duration: {contest.duration} minutes
      </p>
      {!contestStarted ? (
        <Alert variant="info">Contest has not started yet.</Alert>
      ) : (
        <>
          <h3>Problems</h3>
          <div className="d-flex mb-3">
            {contest.problems.map((p, idx) => {
              const alphabet = String.fromCharCode(65 + idx); // A, B, C, etc.
              return (
                <div key={idx} className="mr-3">
                  <a 
                    href={p.contestLink} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="btn btn-outline-primary mr-2"
                  >
                    {alphabet}
                  </a>
                </div>
              );
            })}
          </div>

          <h3>Standings</h3>
          <Button variant="primary" className="mb-3" onClick={refreshLeaderboard}>
            Refresh Standings
          </Button>
          <Table striped bordered hover responsive>
            <thead>
              <tr>
                <th>#</th>
                <th>Who</th>
                {contest.problems.map((p, idx) => {
                  const alphabet = String.fromCharCode(65 + idx);
                  return <th key={idx}>{alphabet}</th>;
                })}
                <th>=</th>
                <th>Penalty</th>
              </tr>
            </thead>
            <tbody>
              {leaderboard.length > 0 ? (
                leaderboard.map((row, idx) => (
                  <tr key={idx}>
                    <td>{idx + 1}</td>
                    <td>{row.displayName}</td>
                    {contest.problems.map((p, problemIdx) => {
                      const alphabet = String.fromCharCode(65 + problemIdx);
                      const problemKey = `${p.contestId}-${p.problemIndex}`;
                      const status = row.problemStatus?.[problemKey];
                      
                      if (!status) {
                        return <td key={problemIdx} className="text-muted">.</td>;
                      }
                      
                      if (status.solved) {
                        return (
                          <td 
                            key={problemIdx} 
                            className="bg-success text-white"
                            title={`+${status.attempts > 0 ? status.attempts : ''}`}
                          >
                            {alphabet}
                            {status.attempts > 0 && <sup>{status.attempts}</sup>}
                          </td>
                        );
                      }
                      
                      if (status.attempts > 0) {
                        return (
                          <td 
                            key={problemIdx} 
                            className="bg-danger text-white"
                            title={`-${status.attempts}`}
                          >
                            {alphabet}
                            <sup>{status.attempts}</sup>
                          </td>
                        );
                      }
                      
                      return <td key={problemIdx} className="text-muted">.</td>;
                    })}
                    <td>{row.solvedCount}</td>
                    <td>{row.penalty}</td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={contest.problems.length + 4} className="text-center">
                    No submissions yet. Click "Refresh Standings" to update.
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