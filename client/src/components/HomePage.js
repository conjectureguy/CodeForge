import React, { useState, useEffect } from 'react';
import { Form, Button, Alert, Card, Row, Col, Container } from 'react-bootstrap';
import { useNavigate } from 'react-router-dom';
import Community from './Community';
import './community.css'; // Ensure this file is in the same folder

function HomePage() {
  const [searchHandle, setSearchHandle] = useState('');
  const [profile, setProfile] = useState(null);
  const [error, setError] = useState('');
  const navigate = useNavigate();

  // Retrieve logged-in user's CodeForces handle from localStorage
  const currentUser = localStorage.getItem('myHandle');

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

  const handleAddFriend = () => {
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
    <Container fluid>
      <Row>
        <Col md={8}>
          {/* Render Community blogs; currentUser comes from localStorage */}
          <Community currentUser={currentUser} />
        </Col>
        <Col md={4}>
          <div className="profile-search-box">
            <h2 className="my-3">Search for a Profile</h2>
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
          </div>
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
                <Button variant="dark" onClick={handleAddFriend}>Add as Friend</Button>
              </Card.Body>
            </Card>
          )}
        </Col>
      </Row>
    </Container>
  );
}

export default HomePage;
