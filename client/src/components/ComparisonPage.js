// src/components/ComparisonPage.js
import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { Table, Spinner, Alert } from 'react-bootstrap';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend } from 'recharts';

function ComparisonPage() {
  const { friendHandle } = useParams();
  const [yourHandle, setYourHandle] = useState('');
  const [commonContests, setCommonContests] = useState([]);
  const [chartData, setChartData] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Assume your handle is saved in localStorage
  useEffect(() => {
    const myHandle = localStorage.getItem('myHandle');
    setYourHandle(myHandle);
  }, []);

  useEffect(() => {
    if (!yourHandle) return;
    setLoading(true);
    Promise.all([
      fetch(`https://codeforces.com/api/user.rating?handle=${yourHandle}`),
      fetch(`https://codeforces.com/api/user.rating?handle=${friendHandle}`)
    ])
      .then(async ([yourRes, friendRes]) => {
        const yourData = await yourRes.json();
        const friendData = await friendRes.json();
        if (yourData.status !== 'OK' || friendData.status !== 'OK') {
          throw new Error('Error fetching rating data.');
        }
        const yourContests = yourData.result.reduce((map, contest) => {
          map[contest.contestId] = contest;
          return map;
        }, {});
        const friendContests = friendData.result.reduce((map, contest) => {
          map[contest.contestId] = contest;
          return map;
        }, {});

        const commonIds = Object.keys(yourContests).filter((id) => friendContests[id]);
        const common = commonIds.map((id) => ({
          contestId: id,
          contestName: yourContests[id].contestName,
          yourRank: yourContests[id].rank,
          friendRank: friendContests[id].rank,
        }));
        common.sort((a, b) => parseInt(a.contestId) - parseInt(b.contestId));
        setCommonContests(common);
        const chartArr = common.map((c) => ({
          contestName: c.contestName,
          yourRank: c.yourRank,
          friendRank: c.friendRank,
        }));
        setChartData(chartArr);
      })
      .catch((err) => setError(err.message || 'Error comparing profiles.'))
      .finally(() => setLoading(false));
  }, [yourHandle, friendHandle]);

  return (
    <div>
      <h2>Comparison with {friendHandle}</h2>
      {error && <Alert variant="danger">{error}</Alert>}
      {loading && <Spinner animation="border" variant="primary" />}
      
      {chartData.length > 0 && (
        <>
          <LineChart
            width={800}
            height={300}
            data={chartData}
            margin={{ top: 20, right: 30, left: 20, bottom: 20 }}
          >
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="contestName" />
            <YAxis reversed={true} />
            <Tooltip />
            <Legend />
            <Line type="monotone" dataKey="yourRank" stroke="#8884d8" />
            <Line type="monotone" dataKey="friendRank" stroke="#82ca9d" />
          </LineChart>

          <h4 className="mt-4">Common Contests</h4>
          <Table striped bordered hover responsive>
            <thead>
              <tr>
                <th>Contest Name</th>
                <th>Your Rank</th>
                <th>{friendHandle}'s Rank</th>
              </tr>
            </thead>
            <tbody>
              {commonContests.map((contest) => (
                <tr key={contest.contestId}>
                  <td>{contest.contestName}</td>
                  <td>{contest.yourRank}</td>
                  <td>{contest.friendRank}</td>
                </tr>
              ))}
            </tbody>
          </Table>
        </>
      )}
    </div>
  );
}

export default ComparisonPage;
