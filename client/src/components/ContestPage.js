// src/components/ContestPage.js
import React, { useState, useEffect } from 'react';
import { Tabs, Tab, Form, Button, Alert, Spinner, Row, Col, ListGroup } from 'react-bootstrap';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';

function ContestPage() {
  const [activeTab, setActiveTab] = useState('create');

  // Creation states
  const [contestName, setContestName] = useState('');
  const [startTime, setStartTime] = useState('');
  const [duration, setDuration] = useState('');
  const [problems, setProblems] = useState([]);
  const [problemLink, setProblemLink] = useState('');
  const [randomRating, setRandomRating] = useState('');
  const [createdContest, setCreatedContest] = useState(null);
  const [createMsg, setCreateMsg] = useState('');
  const [createError, setCreateError] = useState('');
  const [loading, setLoading] = useState(false);

  // Join contest states
  const [joinId, setJoinId] = useState('');
  const [joinMsg, setJoinMsg] = useState('');
  const [joinError, setJoinError] = useState('');
  const [joinLoading, setJoinLoading] = useState(false);

  // My Contests states
  const [allContests, setAllContests] = useState([]);
  const [upcoming, setUpcoming] = useState([]);
  const [running, setRunning] = useState([]);
  const [completed, setCompleted] = useState([]);
  const [contestsLoading, setContestsLoading] = useState(false);
  const [contestsError, setContestsError] = useState('');

  const navigate = useNavigate();
  const admin = localStorage.getItem('myHandle'); // current user

  // Create a contest
  const createContest = async () => {
    if (!contestName || !startTime || !duration || !admin) {
      setCreateError('Fill all required fields and ensure you are logged in.');
      return;
    }
    setLoading(true);
    setCreateError('');
    try {
      const res = await axios.post('http://localhost:5000/api/contests/create', {
        name: contestName,
        startTime,
        duration,
        admin,
        problems,
      });
      if (res.data.success) {
        setCreatedContest({ id: res.data.contestId, link: res.data.contestLink });
        setCreateMsg(`Contest created! Contest ID: ${res.data.contestId}`);
        // Do not clear the form yet—allow admin to add problems
      }
    } catch (err) {
      setCreateError(err.response?.data?.error || 'Error creating contest');
    }
    setLoading(false);
  };

  // Add problem manually
  const addProblem = async () => {
    if (!problemLink || !createdContest) {
      setCreateError('Provide problem link and ensure contest is created.');
      return;
    }
    setLoading(true);
    try {
      const res = await axios.post(`http://localhost:5000/api/contests/${createdContest.id}/add-problem`, { problemLink });
      if (res.data.success) {
        setProblems(res.data.contest.problems);
        setCreateMsg('Problem added successfully.');
      }
    } catch (err) {
      setCreateError(err.response?.data?.error || 'Error adding problem');
    }
    setLoading(false);
  };

  // Add random problem by rating
  const addRandomProblem = async () => {
    if (!randomRating || !createdContest) {
      setCreateError('Provide rating and ensure contest is created.');
      return;
    }
    setLoading(true);
    try {
      const res = await axios.post(`http://localhost:5000/api/contests/${createdContest.id}/add-random`, {
        rating: parseInt(randomRating),
      });
      if (res.data.success) {
        setProblems(res.data.contest.problems);
        setCreateMsg('Random problem added successfully.');
      }
    } catch (err) {
      setCreateError(err.response?.data?.error || 'Error adding random problem');
    }
    setLoading(false);
  };

  // Save changes and exit contest creation prompt
  const saveChanges = async () => {
    if (!createdContest) {
      setCreateError('No contest to save.');
      return;
    }
    try {
      // Optionally, you might call an update endpoint here.
      // For simplicity, we assume the contest with its problems is already saved.
      // Clear creation state and switch to My Contests tab.
      setContestName('');
      setStartTime('');
      setDuration('');
      setProblems([]);
      setProblemLink('');
      setRandomRating('');
      setCreatedContest(null);
      setCreateMsg('Contest saved successfully.');
      setActiveTab('mycontests');
      fetchContests();
    } catch (err) {
      setCreateError(err.response?.data?.error || 'Error saving contest changes');
    }
  };

  // Join a contest
  const joinContest = async () => {
    if (!joinId || !admin) {
      setJoinError('Provide contest ID and ensure you are logged in.');
      return;
    }
    setJoinLoading(true);
    setJoinError('');
    try {
      const res = await axios.post(`http://localhost:5000/api/contests/${joinId}/join`, { username: admin });
      if (res.data.success) {
        setJoinMsg('Joined contest successfully.');
        navigate(`/contest/${res.data.contest.slug}`);
      }
    } catch (err) {
      setJoinError(err.response?.data?.error || 'Error joining contest');
    }
    setJoinLoading(false);
  };

  // Fetch all contests for "My Contests" tab
  const fetchContests = async () => {
    setContestsLoading(true);
    setContestsError('');
    try {
      const res = await axios.get('http://localhost:5000/api/contests');
      if (res.data.success) {
        setAllContests(res.data.contests);
        classifyContests(res.data.contests);
      } else {
        setContestsError('Error fetching contests.');
      }
    } catch (err) {
      setContestsError(err.response?.data?.error || 'Error fetching contests.');
    }
    setContestsLoading(false);
  };

  // Classify contests as Upcoming, Running, Completed
  const classifyContests = (contests) => {
    const now = new Date();
    const up = [];
    const run = [];
    const comp = [];
    contests.forEach(contest => {
      const start = new Date(contest.startTime);
      const end = new Date(start.getTime() + contest.duration * 60000);
      if (now < start) {
        up.push(contest);
      } else if (now >= start && now <= end) {
        run.push(contest);
      } else {
        comp.push(contest);
      }
    });
    setUpcoming(up);
    setRunning(run);
    setCompleted(comp);
  };

  // Fetch contests when "My Contests" tab is active
  useEffect(() => {
    if (activeTab === 'mycontests') {
      fetchContests();
    }
  }, [activeTab]);

  return (
    <div>
      <h2>Custom Contest</h2>
      <Tabs activeKey={activeTab} onSelect={(k) => setActiveTab(k)} className="mb-3">
        <Tab eventKey="create" title="Create Contest">
          {createError && <Alert variant="danger">{createError}</Alert>}
          {createMsg && <Alert variant="success">{createMsg}</Alert>}
          {!createdContest ? (
            <Form>
              <Form.Group className="mb-3">
                <Form.Label>Contest Name</Form.Label>
                <Form.Control type="text" value={contestName} onChange={(e) => setContestName(e.target.value)} />
              </Form.Group>
              <Form.Group className="mb-3">
                <Form.Label>Start Time</Form.Label>
                <Form.Control type="datetime-local" value={startTime} onChange={(e) => setStartTime(e.target.value)} />
              </Form.Group>
              <Form.Group className="mb-3">
                <Form.Label>Duration (minutes)</Form.Label>
                <Form.Control type="number" value={duration} onChange={(e) => setDuration(e.target.value)} />
              </Form.Group>
              <Button variant="primary" onClick={createContest} disabled={loading}>
                {loading ? <Spinner animation="border" size="sm" /> : 'Create Contest'}
              </Button>
            </Form>
          ) : (
            <>
              <Alert variant="info">
                Contest created! Contest ID: {createdContest.id} | Link: {window.location.origin}/contest/{createdContest.link}
              </Alert>
              <h4>Manage Contest Problems</h4>
              <Row className="mb-3">
                <Col md={6}>
                  <Form.Group>
                    <Form.Label>Add Problem by Link</Form.Label>
                    <Form.Control
                      type="text"
                      placeholder="https://codeforces.com/contest/1234/problem/A"
                      value={problemLink}
                      onChange={(e) => setProblemLink(e.target.value)}
                    />
                  </Form.Group>
                  <Button variant="primary" onClick={addProblem} disabled={loading} className="mt-2">
                    Add Problem
                  </Button>
                </Col>
                <Col md={6}>
                  <Form.Group>
                    <Form.Label>Add Random Problem</Form.Label>
                    <Form.Control
                      type="number"
                      placeholder="Enter required rating"
                      value={randomRating}
                      onChange={(e) => setRandomRating(e.target.value)}
                    />
                  </Form.Group>
                  <Button variant="primary" onClick={addRandomProblem} disabled={loading} className="mt-2">
                    Add Random Problem
                  </Button>
                </Col>
              </Row>
              <ListGroup className="mb-3">
                {problems.map((p, idx) => (
                  <ListGroup.Item key={idx}>
                    <a href={p.contestLink} target="_blank" rel="noopener noreferrer">
                      {p.contestLink}
                    </a>
                  </ListGroup.Item>
                ))}
              </ListGroup>
              <Button variant="success" onClick={saveChanges} disabled={loading}>
                Save Changes
              </Button>
            </>
          )}
        </Tab>
        <Tab eventKey="join" title="Join Contest">
          {joinError && <Alert variant="danger">{joinError}</Alert>}
          {joinMsg && <Alert variant="success">{joinMsg}</Alert>}
          <Form className="mb-3">
            <Form.Group className="mb-3">
              <Form.Label>Enter Contest ID or Link</Form.Label>
              <Form.Control
                type="text"
                placeholder="Contest ID"
                value={joinId}
                onChange={(e) => setJoinId(e.target.value)}
              />
            </Form.Group>
            <Button variant="primary" onClick={joinContest} disabled={joinLoading}>
              {joinLoading ? 'Joining...' : 'Join Contest'}
            </Button>
          </Form>
        </Tab>
        <Tab eventKey="mycontests" title="My Contests">
          {contestsError && <Alert variant="danger">{contestsError}</Alert>}
          {contestsLoading && <Spinner animation="border" variant="primary" />}
          {!contestsLoading && (
            <>
              <h4>Upcoming Contests</h4>
              {upcoming.length > 0 ? (
                <ListGroup className="mb-3">
                  {upcoming.map((contest) => (
                    <ListGroup.Item key={contest._id}>
                      <strong>{contest.name}</strong> - Starts at: {new Date(contest.startTime).toLocaleString()}
                      <Button variant="primary" size="sm" className="ms-3" disabled>
                        Enter Contest
                      </Button>
                    </ListGroup.Item>
                  ))}
                </ListGroup>
              ) : (
                <p>No upcoming contests.</p>
              )}
              <h4>Running Contests</h4>
              {running.length > 0 ? (
                <ListGroup className="mb-3">
                  {running.map((contest) => (
                    <ListGroup.Item key={contest._id}>
                      <strong>{contest.name}</strong> - Started at: {new Date(contest.startTime).toLocaleString()}
                      <Button variant="primary" size="sm" className="ms-3" onClick={() => navigate(`/contest/${contest.slug}`)}>
                        Enter Contest
                      </Button>
                    </ListGroup.Item>
                  ))}
                </ListGroup>
              ) : (
                <p>No running contests.</p>
              )}
              <h4>Completed Contests</h4>
              {completed.length > 0 ? (
                <ListGroup className="mb-3">
                  {completed.map((contest) => (
                    <ListGroup.Item key={contest._id}>
                      <strong>{contest.name}</strong> - Ended at: {new Date(new Date(contest.startTime).getTime() + contest.duration * 60000).toLocaleString()}
                      <Button variant="primary" size="sm" className="ms-3" onClick={() => navigate(`/contest/${contest.slug}`)}>
                        View Contest
                      </Button>
                    </ListGroup.Item>
                  ))}
                </ListGroup>
              ) : (
                <p>No completed contests.</p>
              )}
            </>
          )}
        </Tab>
      </Tabs>
    </div>
  );
}

export default ContestPage;
