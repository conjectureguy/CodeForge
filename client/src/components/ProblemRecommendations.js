// src/components/ProblemRecommendationsPage.js
import React, { useState, useEffect } from 'react';
import { Table, Spinner, Alert, Button, ListGroup } from 'react-bootstrap';

function ProblemRecommendationsPage({ userHandle, userRating }) {
  const [weakTopics, setWeakTopics] = useState([]);
  const [selectedTopic, setSelectedTopic] = useState(null);
  const [problems, setProblems] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!userHandle) return;

    setLoading(true);
    fetch(`https://codeforces.com/api/user.status?handle=${userHandle}`)
      .then((res) => res.json())
      .then((data) => {
        if (data.status === 'OK') {
          const problemStats = {};
          
          data.result.forEach((submission) => {
            if (!submission.problem.tags) return;
            
            submission.problem.tags.forEach((tag) => {
              if (!problemStats[tag]) {
                problemStats[tag] = { solved: 0, wrong: 0 };
              }
              if (submission.verdict === 'OK') {
                problemStats[tag].solved++;
              } else {
                problemStats[tag].wrong++;
              }
            });
          });

          // Detect weak topics
          const weakTopicsFiltered = Object.entries(problemStats)
            .filter(([tag, stats]) => stats.solved >= 15 && stats.wrong > stats.solved)
            .map(([tag]) => tag);

          setWeakTopics(weakTopicsFiltered);
        } else {
          setError('Failed to fetch submission data.');
        }
      })
      .catch(() => setError('Failed to fetch submission data.'))
      .finally(() => setLoading(false));
  }, [userHandle]);

  const fetchProblemsForTopic = (topic) => {
    if (!userRating) return;

    setLoading(true);
    fetch('https://codeforces.com/api/problemset.problems')
      .then((res) => res.json())
      .then((data) => {
        if (data.status === 'OK') {
          const filteredProblems = data.result.problems
            .filter(
              (problem) =>
                problem.tags.includes(topic) &&
                problem.rating >= userRating &&
                problem.rating <= userRating + 300
            )
            .slice(0, 20); // Limit to 20 problems

          setProblems(filteredProblems);
          setSelectedTopic(topic);
        } else {
          setError('Failed to fetch problems.');
        }
      })
      .catch(() => setError('Failed to fetch problems.'))
      .finally(() => setLoading(false));
  };

  return (
    <div>
      <h2>Problem Recommendations</h2>
      
      {loading && <Spinner animation="border" variant="primary" />}
      {error && <Alert variant="danger">{error}</Alert>}

      <h4>Weak Topics</h4>
      {weakTopics.length > 0 ? (
        <ListGroup>
          {weakTopics.map((topic, index) => (
            <ListGroup.Item key={index}>
              <Button variant="link" onClick={() => fetchProblemsForTopic(topic)}>
                {topic}
              </Button>
            </ListGroup.Item>
          ))}
        </ListGroup>
      ) : (
        <p>No weak topics detected.</p>
      )}

      {selectedTopic && (
        <div>
          <h4>Recommended Problems for: {selectedTopic}</h4>
          <Table striped bordered hover>
            <thead>
              <tr>
                <th>Problem Name</th>
                <th>Rating</th>
                <th>Link</th>
              </tr>
            </thead>
            <tbody>
              {problems.map((problem, index) => (
                <tr key={index}>
                  <td>{problem.name}</td>
                  <td>{problem.rating || 'N/A'}</td>
                  <td>
                    <a
                      href={`https://codeforces.com/problemset/problem/${problem.contestId}/${problem.index}`}
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      View Problem
                    </a>
                  </td>
                </tr>
              ))}
            </tbody>
          </Table>
        </div>
      )}
    </div>
  );
}

export default ProblemRecommendationsPage;
