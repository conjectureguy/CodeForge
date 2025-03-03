// src/components/FriendsPage.js
import React, { useState, useEffect } from 'react';
import { ListGroup, Spinner, Alert } from 'react-bootstrap';
import { useNavigate } from 'react-router-dom';

function FriendsPage() {
  const [friends, setFriends] = useState([]);
  const [friendsData, setFriendsData] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const navigate = useNavigate();

  // On mount, check for authentication (JWT token)
  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) {
      navigate('/login');
    }
  }, [navigate]);

  // Load friends from localStorage
  useEffect(() => {
    const storedFriends = JSON.parse(localStorage.getItem('friends')) || [];
    setFriends(storedFriends);
  }, []);

  // Fetch each friend's rating data and sort by rating (decreasing)
  useEffect(() => {
    if (friends.length === 0) return;
    setLoading(true);
    Promise.all(
      friends.map((handle) =>
        fetch(`https://codeforces.com/api/user.info?handles=${handle}`)
          .then((res) => res.json())
          .then((data) => data.result[0])
      )
    )
      .then((results) => {
        // Sort friends by rating (highest first)
        results.sort((a, b) => b.rating - a.rating);
        setFriendsData(results);
      })
      .catch(() => setError('Error fetching friend profiles.'))
      .finally(() => setLoading(false));
  }, [friends]);

  return (
    <div>
      <h2>My Friends</h2>
      {error && <Alert variant="danger">{error}</Alert>}
      {loading && <Spinner animation="border" variant="primary" />}
      {friendsData.length > 0 && (
        <ListGroup>
          {friendsData.map((friend) => (
            <ListGroup.Item
              action
              key={friend.handle}
              onClick={() => navigate(`/compare/${friend.handle}`)}
            >
              {friend.handle} — Rating: {friend.rating}
            </ListGroup.Item>
          ))}
        </ListGroup>
      )}
      {friendsData.length === 0 && (
        <Alert variant="info">You have no friends added yet.</Alert>
      )}
    </div>
  );
}

export default FriendsPage;
