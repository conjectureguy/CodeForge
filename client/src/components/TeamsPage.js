// src/components/TeamsPage.js
import React, { useState, useEffect } from 'react';
import { Form, Button, Alert, Spinner, ListGroup } from 'react-bootstrap';
import axios from 'axios';

function TeamsPage() {
  const [teamName, setTeamName] = useState('');
  const [members, setMembers] = useState(['']); // Start with one member field
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [teams, setTeams] = useState([]);

  // Add another member field (max 3)
  const addMemberField = () => {
    if (members.length < 3) {
      setMembers([...members, '']);
    }
  };

  // Remove a member field
  const removeMemberField = (index) => {
    const newMembers = members.filter((_, i) => i !== index);
    setMembers(newMembers);
  };

  // Handle change for a member input
  const handleMemberChange = (index, value) => {
    const newMembers = [...members];
    newMembers[index] = value;
    setMembers(newMembers);
  };

  // Create team handler
  const createTeam = async () => {
    setError('');
    setMessage('');
    // Filter out empty member values
    const validMembers = members.filter(m => m.trim() !== '');
    if (!teamName.trim() || validMembers.length < 1 || validMembers.length > 3) {
      setError('Team name and 1 to 3 members are required.');
      return;
    }
    setLoading(true);
    try {
      const res = await axios.post('http://localhost:5000/api/teams/create', { teamName, members: validMembers });
      if (res.data.success) {
        setMessage('Team created successfully.');
        setTeamName('');
        setMembers(['']);
        fetchTeams();
      }
    } catch (err) {
      setError(err.response?.data?.error || 'Error creating team.');
    }
    setLoading(false);
  };

  // Fetch all teams to display
  const fetchTeams = async () => {
    try {
      const res = await axios.get('http://localhost:5000/api/teams');
      if (res.data.success) {
        setTeams(res.data.teams);
      }
    } catch (err) {
      console.error('Error fetching teams', err);
    }
  };

  useEffect(() => {
    fetchTeams();
  }, []);

  return (
    <div>
      <h2>Teams</h2>
      {error && <Alert variant="danger">{error}</Alert>}
      {message && <Alert variant="success">{message}</Alert>}
      <Form>
        <Form.Group className="mb-3">
          <Form.Label>Team Name</Form.Label>
          <Form.Control
            type="text"
            value={teamName}
            onChange={(e) => setTeamName(e.target.value)}
          />
        </Form.Group>
        <Form.Label>Team Members (Codeforces IDs)</Form.Label>
        {members.map((member, index) => (
          <Form.Group className="mb-3" key={index}>
            <Form.Control
              type="text"
              placeholder="Enter member Codeforces ID"
              value={member}
              onChange={(e) => handleMemberChange(index, e.target.value)}
            />
            {members.length > 1 && (
              <Button variant="danger" size="sm" onClick={() => removeMemberField(index)} className="mt-1">
                Remove
              </Button>
            )}
          </Form.Group>
        ))}
        {members.length < 3 && (
          <Button variant="secondary" onClick={addMemberField}>
            Add Member
          </Button>
        )}
        <div className="mt-3">
          <Button variant="primary" onClick={createTeam} disabled={loading}>
            {loading ? <Spinner animation="border" size="sm" /> : 'Create Team'}
          </Button>
        </div>
      </Form>
      <hr />
      <h3>Existing Teams</h3>
      <ListGroup>
        {teams.map(team => (
          <ListGroup.Item key={team._id}>
            <strong>{team.teamName}</strong> - Members: {team.members.join(', ')}
          </ListGroup.Item>
        ))}
      </ListGroup>
    </div>
  );
}

export default TeamsPage;
