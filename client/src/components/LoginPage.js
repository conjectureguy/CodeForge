// src/components/LoginPage.js
import React, { useState } from 'react';
import { Form, Button, Alert, Spinner } from 'react-bootstrap';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';

function LoginPage() {
    const [username, setUsername] = useState('');
    const [challenge, setChallenge] = useState(null);
    const [loading, setLoading] = useState(false);
    const [checkLoading, setCheckLoading] = useState(false);
    const [message, setMessage] = useState('');
    const [error, setError] = useState('');
    const navigate = useNavigate();

    // Start the login challenge when the user submits their username.
    const startLogin = async (e) => {
        e.preventDefault();
        if (!username) return;
        setLoading(true);
        setError('');
        setMessage('');
        try {
            const res = await axios.post('http://localhost:5000/api/auth/login', { username });
            setChallenge(res.data);
            setMessage(
                `Challenge started! Please submit a compilation error for the following problem within 60 seconds: ${res.data.problemLink}`
            );
        } catch (err) {
            console.log(err);
            setError(err.response?.data?.error || 'Error starting login challenge');
        }
        setLoading(false);
    };

    // Check if the login challenge has been successfully passed.
    const checkChallenge = async () => {
        if (!challenge) return;
        setCheckLoading(true);
        try {
            const res = await axios.get(`http://localhost:5000/api/auth/challenge-check?challengeId=${challenge.challengeId}`);
            if (res.data.success) {
                // Save username (and token if needed) to localStorage.
                localStorage.setItem('myHandle', username);
                setMessage('Login successful!');
                // Redirect to home or another page.
                navigate('/');
            }
        } catch (err) {
            setError(err.response?.data?.error || 'Error checking challenge');
        }
        setCheckLoading(false);
    };

    return (
        <div>
            <h2>Login</h2>
            {!challenge ? (
                <Form onSubmit={startLogin}>
                    {error && <Alert variant="danger">{error}</Alert>}
                    <Form.Group className="mb-3">
                        <Form.Label>Enter your Codeforces username:</Form.Label>
                        <Form.Control
                            type="text"
                            value={username}
                            onChange={(e) => setUsername(e.target.value)}
                        />
                    </Form.Group>
                    <Button variant="primary" type="submit" disabled={loading}>
                        {loading ? <Spinner animation="border" size="sm" /> : 'Start Login Challenge'}
                    </Button>
                </Form>
            ) : (
                <div>
                    {message && <Alert variant="info">{message}</Alert>}
                    <Button variant="success" onClick={checkChallenge} disabled={checkLoading}>
                        {checkLoading ? <Spinner animation="border" size="sm" /> : 'Check Challenge'}
                    </Button>
                </div>
            )}
        </div>
    );
}

export default LoginPage;
