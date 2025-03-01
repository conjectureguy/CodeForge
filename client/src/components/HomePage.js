// src/components/HomePage.js
import React, { useState } from 'react';
import { Form, Button, Alert, Card } from 'react-bootstrap';
import { useNavigate } from 'react-router-dom';

function HomePage() {
  const [searchHandle, setSearchHandle] = useState('');
  const [profile, setProfile] = useState(null);
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const handleSearch = async () => {
    if (!searchHandle.trim()) {
      setError('Please enter a valid handle.');
      return;
    }
    setError('');
    setProfile(null);
    try {
      const res = await fetch(`https://codeforces.com/api/user.info?handles=${searchHandle}`);
      const data = await res.json();
      if (data.status === 'OK') {
        setProfile(data.result[0]);
      } else {
        setError('User not found.');
      }
    } catch (err) {
      setError('Error fetching profile.');
    }
  };

  // Simulated add friend: in a real app, call your backend and update friend list.
  const handleAddFriend = () => {
    // Save the friend to localStorage (or update global state) for demo purposes.
    const friends = JSON.parse(localStorage.getItem('friends')) || [];
    if (!friends.includes(searchHandle)) {
      friends.push(searchHandle);
      localStorage.setItem('friends', JSON.stringify(friends));
      alert(`${searchHandle} added as a friend!`);
    } else {
      alert(`${searchHandle} is already your friend.`);
    }
  };

  return (
    <div>
      <h2>Search for a Profile</h2>
      {error && <Alert variant="danger">{error}</Alert>}
      <Form.Group className="mb-3">
        <Form.Control
          type="text"
          placeholder="Enter Codeforces handle"
          value={searchHandle}
          onChange={(e) => setSearchHandle(e.target.value)}
        />
      </Form.Group>
      <Button variant="primary" onClick={handleSearch}>Search</Button>

      {profile && (
        <Card className="mt-4">
          <Card.Body>
            <Card.Title>{profile.handle}</Card.Title>
            <Card.Img
              variant="top"
              src={profile.titlePhoto}
              alt={profile.handle}
              style={{ width: '150px', borderRadius: '50%' }}
            />
            <Card.Text>
              <strong>Rank:</strong> {profile.rank} <br />
              <strong>Rating:</strong> {profile.rating} <br />
              <strong>Max Rank:</strong> {profile.maxRank} ({profile.maxRating})
            </Card.Text>
            <Button variant="success" onClick={handleAddFriend}>Add as Friend</Button>
          </Card.Body>
        </Card>
      )}
    </div>
  );
}

export default HomePage;
