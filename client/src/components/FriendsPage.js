import React, { useState, useEffect } from 'react';
import { ListGroup, Spinner, Alert } from 'react-bootstrap';
import { useNavigate } from 'react-router-dom';

function FriendsPage() {
  const [friends, setFriends] = useState([]);
  const [friendsData, setFriendsData] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const navigate = useNavigate();

  // Check authentication on mount
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

  // Fetch friend data from CodeForces API (single request, no sorting)
  useEffect(() => {
    if (friends.length === 0) return;
    setLoading(true);
    const handles = friends.join(';');
    fetch(`https://codeforces.com/api/user.info?handles=${handles}`)
      .then((res) => res.json())
      .then((data) => {
        if (data.status === 'OK') {
          setFriendsData(data.result);
        } else {
          setError('Error fetching friend profiles.');
        }
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
