// src/components/ProfilePage.js
import React, { useState, useEffect } from 'react';
import {
  Card,
  Button,
  Spinner,
  Alert,
  Form,
  Table,
  ListGroup,
} from 'react-bootstrap';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  BarChart,
  Bar,
} from 'recharts';
import CalendarHeatmap from 'react-calendar-heatmap';
import 'react-calendar-heatmap/dist/styles.css';
import { useNavigate } from 'react-router-dom';
import './ProfilePage.css';

function ProfilePage() {
  // Existing states
  const [handle, setHandle] = useState('');
  const [inputHandle, setInputHandle] = useState('');
  const [profile, setProfile] = useState(null);
  const [ratingChanges, setRatingChanges] = useState([]);
  const [tagDist, setTagDist] = useState([]);
  const [ratingDist, setRatingDist] = useState([]);
  const [heatmapValues, setHeatmapValues] = useState([]);
  const [recentSolves, setRecentSolves] = useState([]);
  const [friends, setFriends] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [customContests, setCustomContests] = useState([]);

  const navigate = useNavigate();

  // On mount, check for authentication (JWT token)
  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) {
      navigate('/login');
    }
  }, [navigate]);

  // On mount, load saved handle and friends.
  useEffect(() => {
    const savedHandle = localStorage.getItem('myHandle');
    if (savedHandle) {
      setHandle(savedHandle);
      setInputHandle(savedHandle);
    }
    const storedFriends = JSON.parse(localStorage.getItem('friends')) || [];
    setFriends(storedFriends);
  }, []);

  // Fetch CodeForces profile info, rating changes, and submissions.
  useEffect(() => {
    if (!handle) return;
    setLoading(true);
    setError('');
    setProfile(null);
    setRatingChanges([]);
    setTagDist([]);
    setRatingDist([]);
    setHeatmapValues([]);
    setRecentSolves([]);

    Promise.all([
      fetch(`https://codeforces.com/api/user.info?handles=${handle}`),
      fetch(`https://codeforces.com/api/user.rating?handle=${handle}`),
      fetch(`https://codeforces.com/api/user.status?handle=${handle}&from=1&count=10000`),
    ])
      .then(async ([infoRes, ratingRes, statusRes]) => {
        const infoData = await infoRes.json();
        const ratingData = await ratingRes.json();
        const statusData = await statusRes.json();

        if (infoData.status !== 'OK') {
          throw new Error('Error fetching user info.');
        }
        if (ratingData.status !== 'OK') {
          throw new Error('Error fetching rating data.');
        }
        if (statusData.status !== 'OK') {
          throw new Error('Error fetching submissions.');
        }

        setProfile(infoData.result[0]);
        setRatingChanges(ratingData.result);
        buildAnalytics(statusData.result);
      })
      .catch((err) => setError(err.message || 'Something went wrong.'))
      .finally(() => setLoading(false));
  }, [handle]);

  // Fetch custom contests from your backend.
  useEffect(() => {
    if (!handle) return;
    fetch('/contests/my-contests')
      .then((res) => res.json())
      .then((data) => {
        if (data.success) {
          setCustomContests(data.contests);
        }
      })
      .catch((err) => console.error('Error fetching custom contests:', err));
  }, [handle]);

  // Process submissions to build analytics.
  const buildAnalytics = (submissions) => {
    const tagCountMap = {};
    const ratingCountMap = {};
    const dayCountMap = {};
    const successfulSubs = [];

    submissions.forEach((sub) => {
      if (sub.verdict === 'OK' && sub.problem) {
        successfulSubs.push(sub);
        (sub.problem.tags || []).forEach((tag) => {
          tagCountMap[tag] = (tagCountMap[tag] || 0) + 1;
        });
        const prRating = sub.problem.rating;
        if (prRating) {
          ratingCountMap[prRating] = (ratingCountMap[prRating] || 0) + 1;
        }
        const dateObj = new Date(sub.creationTimeSeconds * 1000);
        const yyyy = dateObj.getFullYear();
        const mm = String(dateObj.getMonth() + 1).padStart(2, '0');
        const dd = String(dateObj.getDate()).padStart(2, '0');
        const dayKey = `${yyyy}-${mm}-${dd}`;
        dayCountMap[dayKey] = (dayCountMap[dayKey] || 0) + 1;
      }
    });

    const tagArray = Object.entries(tagCountMap).map(([tag, count]) => ({
      name: tag,
      value: count,
    }));
    tagArray.sort((a, b) => b.value - a.value);
    setTagDist(tagArray);

    const ratingArray = Object.entries(ratingCountMap).map(([rating, count]) => ({
      rating,
      solved: count,
    }));
    ratingArray.sort((a, b) => parseInt(a.rating) - parseInt(b.rating));
    setRatingDist(ratingArray);

    const heatmapArray = Object.entries(dayCountMap).map(([date, count]) => ({
      date,
      count,
    }));
    setHeatmapValues(heatmapArray);

    successfulSubs.sort((a, b) => b.creationTimeSeconds - a.creationTimeSeconds);
    const recent = successfulSubs.slice(0, 5).map((sub) => ({
      contestId: sub.contestId,
      index: sub.problem.index,
      name: sub.problem.name,
      creationTime: sub.creationTimeSeconds,
    }));
    setRecentSolves(recent);
  };

  // Save the entered handle to local storage.
  const handleSave = () => {
    if (!inputHandle.trim()) {
      setError('Please enter a valid handle.');
      return;
    }
    setError('');
    localStorage.setItem('myHandle', inputHandle.trim());
    setHandle(inputHandle.trim());
  };

  // Logout: remove stored handle and token, then navigate to login.
  const handleLogout = () => {
    localStorage.removeItem('myHandle');
    localStorage.removeItem('token');
    navigate('/login');
  };

  const handleFriendClick = (friendHandle) => {
    navigate(`/compare/${friendHandle}`);
  };

  const shiftDate = (date, numDays) => {
    const newDate = new Date(date);
    newDate.setDate(newDate.getDate() + numDays);
    return newDate;
  };

  return (
    <div>
      <h2>My Profile</h2>
      {!handle ? (
        <div>
          {error && <Alert variant="danger">{error}</Alert>}
          <Form.Group className="mb-3">
            <Form.Control
              type="text"
              placeholder="Enter your Codeforces handle"
              value={inputHandle}
              onChange={(e) => setInputHandle(e.target.value)}
            />
          </Form.Group>
          <Button variant="primary" onClick={handleSave}>
            Save My Profile
          </Button>
        </div>
      ) : (
        <>
          <Button variant="danger" onClick={handleLogout} className="mb-3">
            Logout
          </Button>
          {error && <Alert variant="danger">{error}</Alert>}
          {loading && (
            <div className="text-center my-3">
              <Spinner animation="border" variant="primary" />
            </div>
          )}
          {profile && (
            <Card className="mb-4">
              <Card.Body className="text-center">
                <Card.Img
                  src={profile.titlePhoto}
                  alt={profile.handle}
                  style={{ width: '150px', borderRadius: '50%' }}
                />
                <Card.Title>{profile.handle}</Card.Title>
                <Card.Text>
                  <strong>Rank:</strong> {profile.rank} <br />
                  <strong>Rating:</strong> {profile.rating} <br />
                  <strong>Max Rank:</strong> {profile.maxRank} ({profile.maxRating})
                </Card.Text>
              </Card.Body>
            </Card>
          )}

          {/* Custom Contests Section */}
          {customContests.length > 0 && (
            <div className="mb-5">
              <h4 className="text-center">My Custom Contests</h4>
              <ListGroup>
                {customContests.map((contest, idx) => (
                  <ListGroup.Item key={idx}>
                    <strong>{contest.title}</strong>
                    <div>
                      <em>Problems:</em> {contest.problems.join(', ')}
                    </div>
                    <div>
                      <em>Average Score:</em> {contest.analytics.averageScore}
                    </div>
                    <div>
                      <em>Total Submissions:</em> {contest.analytics.totalSubmissions}
                    </div>
                  </ListGroup.Item>
                ))}
              </ListGroup>
            </div>
          )}

          {/* Rating Changes, Tag/Rating Distribution, Heatmap, Recent Solves, and Friends List */}
          {ratingChanges.length > 0 && (
            <div className="mb-5">
              <h4 className="text-center">Rating Changes Over Time</h4>
              <LineChart
                width={800}
                height={300}
                data={ratingChanges.map((rc) => ({
                  contestName: rc.contestName,
                  newRating: rc.newRating,
                }))}
                margin={{ top: 20, right: 30, left: 20, bottom: 20 }}
              >
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="contestName" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Line type="monotone" dataKey="newRating" stroke="#8884d8" />
              </LineChart>
            </div>
          )}

          {tagDist.length > 0 && (
            <div className="mb-5">
              <h4 className="text-center">Problem Tag Distribution</h4>
              <BarChart
                width={800}
                height={300}
                data={tagDist}
                margin={{ top: 20, right: 30, left: 20, bottom: 20 }}
              >
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" />
                <YAxis />
                <Tooltip />
                <Bar dataKey="value" fill="#8884d8" />
              </BarChart>
            </div>
          )}

          {ratingDist.length > 0 && (
            <div className="mb-5">
              <h4 className="text-center">Problem Rating Distribution</h4>
              <BarChart
                width={800}
                height={300}
                data={ratingDist}
                margin={{ top: 20, right: 30, left: 20, bottom: 20 }}
              >
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="rating" />
                <YAxis />
                <Tooltip />
                <Bar dataKey="solved" fill="#82ca9d" />
              </BarChart>
            </div>
          )}

          {heatmapValues.length > 0 && (
            <div className="mb-5 text-center">
              <h4>Daily Solve Streak (Past Year)</h4>
              <CalendarHeatmap
                startDate={shiftDate(new Date(), -365)}
                endDate={new Date()}
                values={heatmapValues}
                classForValue={(value) => {
                  if (!value || value.count === 0) {
                    return 'color-empty';
                  }
                  if (value.count >= 5) return 'color-scale-4';
                  if (value.count >= 3) return 'color-scale-3';
                  if (value.count >= 2) return 'color-scale-2';
                  return 'color-scale-1';
                }}
                tooltipDataAttrs={(value) => {
                  return {
                    'data-tip': value.date
                      ? `${value.date} — ${value.count} solve(s)`
                      : 'No solves',
                  };
                }}
                showWeekdayLabels
              />
            </div>
          )}

          {recentSolves.length > 0 && (
            <div className="mb-5">
              <h4 className="text-center">5 Most Recent Solved Problems</h4>
              <Table striped bordered hover responsive>
                <thead>
                  <tr>
                    <th>Problem Name</th>
                    <th>Contest ID</th>
                    <th>Index</th>
                    <th>Solved At</th>
                  </tr>
                </thead>
                <tbody>
                  {recentSolves.map((prob, idx) => {
                    const date = new Date(prob.creationTime * 1000).toLocaleString();
                    return (
                      <tr key={idx}>
                        <td>{prob.name}</td>
                        <td>{prob.contestId}</td>
                        <td>{prob.index}</td>
                        <td>{date}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </Table>
            </div>
          )}

          <div className="mb-5">
            <h4 className="text-center">My Friends</h4>
            {friends.length > 0 ? (
              <ListGroup horizontal className="justify-content-center">
                {friends.map((f) => (
                  <ListGroup.Item key={f} action onClick={() => navigate(`/compare/${f}`)}>
                    {f}
                  </ListGroup.Item>
                ))}
              </ListGroup>
            ) : (
              <Alert variant="info" className="text-center">
                You have not added any friends yet.
              </Alert>
            )}
          </div>
        </>
      )}
    </div>
  );
}

export default ProfilePage;
