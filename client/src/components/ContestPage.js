// src/components/ContestPage.js
import React, { useState, useEffect } from 'react';
import {
  Tabs,
  Tab,
  Form,
  Button,
  Alert,
  Spinner,
  Row,
  Col,
  ListGroup,
} from 'react-bootstrap';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';

function ContestPage() {
  const [activeTab, setActiveTab] = useState('create');

  // ----- Creation States -----
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

  // New: Admin participation mode (join as team or individual)
  const [joinAsTeamAdmin, setJoinAsTeamAdmin] = useState(false);
  const [myTeams, setMyTeams] = useState([]);
  const [selectedTeam, setSelectedTeam] = useState('');

  // ----- Join Contest (Individual) States -----
  const [joinId, setJoinId] = useState('');
  const [joinMsg, setJoinMsg] = useState('');
  const [joinError, setJoinError] = useState('');
  const [joinLoading, setJoinLoading] = useState(false);

  // ----- Join Contest (Team) States -----
  const [joinTeamId, setJoinTeamId] = useState('');
  const [joinTeamName, setJoinTeamName] = useState('');
  // Initialize as empty array so no unwanted empty strings are sent
  const [joinTeamMembers, setJoinTeamMembers] = useState([]);
  const [joinTeamError, setJoinTeamError] = useState('');
  const [joinTeamMsg, setJoinTeamMsg] = useState('');
  const [joinTeamLoading, setJoinTeamLoading] = useState(false);

  // ----- My Contests States -----
  const [allContests, setAllContests] = useState([]);
  const [upcoming, setUpcoming] = useState([]);
  const [running, setRunning] = useState([]);
  const [completed, setCompleted] = useState([]);
  const [contestsLoading, setContestsLoading] = useState(false);
  const [contestsError, setContestsError] = useState('');

  const navigate = useNavigate();
  const admin = localStorage.getItem('myHandle'); // current user

  // ----- Fetch Admin's Teams -----
  const fetchMyTeams = async () => {
    try {
      const res = await axios.get('http://localhost:5000/api/teams');
      if (res.data.success) {
        // Filter teams where the admin is one of the members
        const myTeamsList = res.data.teams.filter((team) =>
          team.members.includes(admin)
        );
        setMyTeams(myTeamsList);
      }
    } catch (err) {
      console.error('Error fetching teams:', err);
    }
  };

  // ----- Create a Contest -----
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
        // Fetch teams so admin can choose to join as team, if desired
        fetchMyTeams();
      }
    } catch (err) {
      setCreateError(err.response?.data?.error || 'Error creating contest');
    }
    setLoading(false);
  };

  // ----- Add Problem Manually -----
  const addProblem = async () => {
    if (!problemLink || !createdContest) {
      setCreateError('Provide problem link and ensure contest is created.');
      return;
    }
    setLoading(true);
    try {
      const res = await axios.post(
        `http://localhost:5000/api/contests/${createdContest.id}/add-problem`,
        { problemLink }
      );
      if (res.data.success) {
        setProblems(res.data.contest.problems);
        setCreateMsg('Problem added successfully.');
      }
    } catch (err) {
      setCreateError(err.response?.data?.error || 'Error adding problem');
    }
    setLoading(false);
  };

  // ----- Add Random Problem by Rating -----
  const addRandomProblem = async () => {
    if (!randomRating || !createdContest) {
      setCreateError('Provide rating and ensure contest is created.');
      return;
    }
    setLoading(true);
    try {
      const res = await axios.post(
        `http://localhost:5000/api/contests/${createdContest.id}/add-random`,
        { rating: parseInt(randomRating) }
      );
      if (res.data.success) {
        setProblems(res.data.contest.problems);
        setCreateMsg('Random problem added successfully.');
      }
    } catch (err) {
      setCreateError(err.response?.data?.error || 'Error adding random problem');
    }
    setLoading(false);
  };

  // ----- Save Changes and Exit Contest Creation Prompt -----
  const saveChanges = async () => {
    if (!createdContest) {
      setCreateError('No contest to save.');
      return;
    }
    try {
      // If admin chose to join as team and selected a team, call join-team endpoint
      if (joinAsTeamAdmin && selectedTeam) {
        await axios.post(
          `http://localhost:5000/api/contests/${createdContest.id}/join-team`,
          { teamName: selectedTeam }
        );
      } else {
        // Otherwise, join as individual
        await axios.post(`http://localhost:5000/api/contests/${createdContest.id}/join`, {
          username: admin,
        });
      }
      // Clear creation fields and switch to "My Contests" tab
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

  // ----- Join Contest as Individual -----
  const joinContest = async () => {
    if (!joinId || !admin) {
      setJoinError('Provide contest ID and ensure you are logged in.');
      return;
    }
    setJoinLoading(true);
    setJoinError('');
    try {
      const res = await axios.post(
        `http://localhost:5000/api/contests/${joinId}/join`,
        { username: admin }
      );
      if (res.data.success) {
        setJoinMsg('Joined contest successfully.');
        navigate(`/contest/${res.data.contest.slug}`);
      }
    } catch (err) {
      setJoinError(err.response?.data?.error || 'Error joining contest');
    }
    setJoinLoading(false);
  };

  // ----- Join Contest as Team -----
  const joinAsTeam = async () => {
    if (!joinTeamId) {
      setJoinTeamError('Contest ID required.');
      return;
    }
    if (!joinTeamName.trim()) {
      setJoinTeamError('Team name required.');
      return;
    }
    const filteredMembers = joinTeamMembers.filter((m) => m.trim() !== '');
    // If creating a new team, require 1–3 members; otherwise, assume team exists
    if (filteredMembers.length > 0 && (filteredMembers.length < 1 || filteredMembers.length > 3)) {
      setJoinTeamError('Team must have 1 to 3 valid members.');
      return;
    }
    setJoinTeamLoading(true);
    setJoinTeamError('');
    try {
      const payload = { teamName: joinTeamName };
      if (filteredMembers.length > 0) {
        payload.members = filteredMembers;
      }
      const res = await axios.post(
        `http://localhost:5000/api/contests/${joinTeamId}/join-team`,
        payload
      );
      if (res.data.success) {
        setJoinTeamMsg('Team joined contest successfully.');
        navigate(`/contest/${res.data.contest.slug}`);
      }
    } catch (err) {
      setJoinTeamError(err.response?.data?.error || 'Error joining contest as team');
    }
    setJoinTeamLoading(false);
  };

  // ----- Fetch All Contests for "My Contests" Tab -----
  const fetchContests = async () => {
    setContestsLoading(true);
    setContestsError('');
    try {
      const res = await axios.get('http://localhost:5000/api/contests');
      if (res.data.success) {
        // Filter contests to only those in which the current admin participates (as individual or team)
        const myContests = res.data.contests.filter((contest) =>
          contest.participants.some((p) => {
            if (p.isTeam) {
              return p.members.includes(admin);
            } else {
              return p.username === admin;
            }
          })
        );
        setAllContests(myContests);
        classifyContests(myContests);
      } else {
        setContestsError('Error fetching contests.');
      }
    } catch (err) {
      setContestsError(err.response?.data?.error || 'Error fetching contests.');
    }
    setContestsLoading(false);
  };

  const classifyContests = (contests) => {
    const now = new Date();
    const up = [];
    const run = [];
    const comp = [];
    contests.forEach((contest) => {
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

  useEffect(() => {
    if (activeTab === 'mycontests') {
      fetchContests();
    }
  }, [activeTab]);

  // ----- Utility: Manage Team Member Fields for Team Join -----
  const addTeamMemberField = () => {
    if (joinTeamMembers.length < 3) {
      setJoinTeamMembers([...joinTeamMembers, '']);
    }
  };
  const removeTeamMemberField = (index) => {
    const updated = joinTeamMembers.filter((_, i) => i !== index);
    setJoinTeamMembers(updated);
  };
  const handleTeamMemberChange = (index, value) => {
    const updated = [...joinTeamMembers];
    updated[index] = value;
    setJoinTeamMembers(updated);
  };

  return (
    <div>
      <h2>Custom Contest</h2>
      <Tabs activeKey={activeTab} onSelect={(k) => setActiveTab(k)} className="mb-3">
        {/* CREATE CONTEST TAB */}
        <Tab eventKey="create" title="Create Contest">
          {createError && <Alert variant="danger">{createError}</Alert>}
          {createMsg && <Alert variant="success">{createMsg}</Alert>}
          {!createdContest ? (
            <Form>
              <Form.Group className="mb-3">
                <Form.Label>Contest Name</Form.Label>
                <Form.Control
                  type="text"
                  value={contestName}
                  onChange={(e) => setContestName(e.target.value)}
                />
              </Form.Group>
              <Form.Group className="mb-3">
                <Form.Label>Start Time</Form.Label>
                <Form.Control
                  type="datetime-local"
                  value={startTime}
                  onChange={(e) => setStartTime(e.target.value)}
                />
              </Form.Group>
              <Form.Group className="mb-3">
                <Form.Label>Duration (minutes)</Form.Label>
                <Form.Control
                  type="number"
                  value={duration}
                  onChange={(e) => setDuration(e.target.value)}
                />
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
              {/* Ask admin if they want to join as team */}
              <Form.Group className="mb-3">
                <Form.Label>Join contest as:</Form.Label>
                <Form.Check
                  type="radio"
                  label="Individual"
                  name="joinMode"
                  checked={!joinAsTeamAdmin}
                  onChange={() => setJoinAsTeamAdmin(false)}
                />
                <Form.Check
                  type="radio"
                  label="Team"
                  name="joinMode"
                  checked={joinAsTeamAdmin}
                  onChange={() => setJoinAsTeamAdmin(true)}
                />
              </Form.Group>
              {joinAsTeamAdmin && (
                <>
                  <Alert variant="info">
                    Select one of your teams to join the contest (if already registered):
                  </Alert>
                  <Form.Group className="mb-3">
                    <Form.Label>My Teams</Form.Label>
                    <Form.Control
                      as="select"
                      value={selectedTeam}
                      onChange={(e) => setSelectedTeam(e.target.value)}
                    >
                      <option value="">-- Select Team --</option>
                      {myTeams.map((team) => (
                        <option key={team._id} value={team.teamName}>
                          {team.teamName} (Members: {team.members.join(', ')})
                        </option>
                      ))}
                    </Form.Control>
                  </Form.Group>
                </>
              )}
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
                    {String.fromCharCode(65 + idx)} {'. '}
                    <a href={p.contestLink} target="_blank" rel="noopener noreferrer">
                      {p.contestLink}
                    </a>{' '}
                  </ListGroup.Item>
                ))}
              </ListGroup>
              <Button variant="success" onClick={saveChanges} disabled={loading}>
                Save Changes
              </Button>
            </>
          )}
        </Tab>

        {/* JOIN CONTEST TAB */}
        <Tab eventKey="join" title="Join Contest" onClick={fetchMyTeams}>
          {joinError && <Alert variant="danger">{joinError}</Alert>}
          {joinMsg && <Alert variant="success">{joinMsg}</Alert>}
          {/* Join as Individual */}
          <Form className="mb-3">
            <Form.Group className="mb-3">
              <Form.Label>Enter Contest ID or Link (Individual)</Form.Label>
              <Form.Control
                type="text"
                placeholder="Contest ID"
                value={joinId}
                onChange={(e) => setJoinId(e.target.value)}
              />
            </Form.Group>
            <Button variant="primary" onClick={joinContest} disabled={joinLoading}>
              {joinLoading ? 'Joining...' : 'Join Contest (Individual)'}
            </Button>
          </Form>
          <hr />
          {/* Join as Team */}
          <h4>Join as Team</h4>
          {joinTeamError && <Alert variant="danger">{joinTeamError}</Alert>}
          {joinTeamMsg && <Alert variant="success">{joinTeamMsg}</Alert>}
          <Form.Group className="mb-3">
            <Form.Label>Enter Contest ID (Team)</Form.Label>
            <Form.Control
              type="text"
              placeholder="Contest ID"
              value={joinTeamId}
              onChange={(e) => setJoinTeamId(e.target.value)}
            />
          </Form.Group>
          {/* <Form.Group className="mb-3">
            <Form.Label>Team Name</Form.Label>
            <Form.Control
              type="text"
              placeholder="Enter your team name"
              value={joinTeamName}
              onChange={(e) => setJoinTeamName(e.target.value)}
            />
          </Form.Group> */}

          <Form.Group className="mb-3">
            <Form.Label>Select Your Team</Form.Label>
            <Form.Control
              as="select"
              value={selectedTeam}
              onChange={(e) => {setSelectedTeam(e.target.value);
                setJoinTeamName(e.target.value);
              }}
            >
              <option value="">-- Select Team --</option>
              {myTeams.map((team) => (
                <option key={team._id} value={team.teamName}>
                  {team.teamName} (Members: {team.members.join(', ')})
                </option>
              ))}
            </Form.Control>
          </Form.Group>

          {/* <Form.Label>
            Team Members (Optional: to register a new team; leave blank if using an existing team)
          </Form.Label>
          {joinTeamMembers.map((mem, idx) => (
            <Form.Group key={idx} className="mb-2">
              <Form.Control
                type="text"
                placeholder="Codeforces handle"
                value={mem}
                onChange={(e) => handleTeamMemberChange(idx, e.target.value)}
              />
              {joinTeamMembers.length > 1 && (
                <Button
                  variant="danger"
                  size="sm"
                  className="mt-1"
                  onClick={() => removeTeamMemberField(idx)}
                >
                  Remove
                </Button>
              )}
            </Form.Group>
          ))}
          {joinTeamMembers.length < 3 && (
            <Button variant="secondary" size="sm" onClick={addTeamMemberField} className="mb-3">
              Add Member
            </Button>
          )} */}
          <div className="mb-3">
            <Button variant="primary" onClick={joinAsTeam} disabled={joinTeamLoading}>
              {joinTeamLoading ? 'Joining...' : 'Join Contest (Team)'}
            </Button>
          </div>
        </Tab>

        {/* MY CONTESTS TAB */}
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
                      <strong>{contest.name}</strong> - Starts at:{' '}
                      {new Date(contest.startTime).toLocaleString()}
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
                      <strong>{contest.name}</strong> - Started at:{' '}
                      {new Date(contest.startTime).toLocaleString()}
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
                      <strong>{contest.name}</strong> - Ended at:{' '}
                      {new Date(new Date(contest.startTime).getTime() + contest.duration * 60000).toLocaleString()}
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
