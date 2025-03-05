
import React, { useState, useEffect } from 'react';
import { Form, Button, Alert, Spinner, ListGroup } from 'react-bootstrap';
import axios from 'axios';

function TeamsPage() {
  // Get the current user's CodeForces handle from localStorage
  const currentUser = localStorage.getItem('myHandle');

  const [teamName, setTeamName] = useState('');
  // The members state now represents only additional members (other than the logged-in user)
  const [members, setMembers] = useState(['']);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [teams, setTeams] = useState([]);

  // Limit additional members to 2 (since the logged-in user is automatically included)
  const addMemberField = () => {
    if (members.length < 2) {
      setMembers([...members, '']);
    }
  };

  const removeMemberField = (index) => {
    const newMembers = members.filter((_, i) => i !== index);
    setMembers(newMembers);
  };

  const handleMemberChange = (index, value) => {
    const newMembers = [...members];
    newMembers[index] = value;
    setMembers(newMembers);
  };

  // Create team handler: ensures currentUser is included in the team members.
  const createTeam = async () => {
    setError('');
    setMessage('');

    // Block team creation if no user is logged in
    if (!currentUser) {
      setError('You must be logged in to create a team.');
      return;
    }

    // Filter out empty strings from additional members input
    const additionalMembers = members.filter(m => m.trim() !== '');

    // Validate the team name
    if (!teamName.trim()) {
      setError('Team name is required.');
      return;
    }

    // Remove any duplicate if user already entered his/her own handle
    const filteredAdditional = additionalMembers.filter(m => m !== currentUser);

    // Combine the current user's handle with the additional members
    const teamMembers = [currentUser, ...filteredAdditional];

    // Optionally, you can validate the total number of team members
    if (teamMembers.length < 1 || teamMembers.length > 3) {
      setError('Total team members must be between 1 and 3 (including yourself).');
      return;
    }

    setLoading(true);
    try {
      const res = await axios.post('http://localhost:5000/api/teams/create', { teamName, members: teamMembers });
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

  // Fetch all teams from the backend
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

  // Filter teams where the current user is a member
  const myTeams = teams.filter(team => currentUser && team.members.includes(currentUser));

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
        <Form.Text className="text-muted">
          Your CodeForces handle: {currentUser || 'Not logged in'}
        </Form.Text>
        <br/>
        <Form.Label className="mt-3">Additional Team Members (Codeforces IDs)</Form.Label>
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
        {members.length < 2 && (
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
      {currentUser && (
        <>
          <hr />
          <h3>My Teams</h3>
          {myTeams.length > 0 ? (
            <ListGroup>
              {myTeams.map(team => (
                <ListGroup.Item key={team._id}>
                  <strong>{team.teamName}</strong> - Members: {team.members.join(', ')}
                </ListGroup.Item>
              ))}
            </ListGroup>
          ) : (
            <p>You are not a member of any team yet.</p>
          )}
        </>
      )}
    </div>
  );
}

export default TeamsPage;
