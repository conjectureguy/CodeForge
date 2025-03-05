import React, { useState } from 'react';
import { Form, Button, Alert, Spinner } from 'react-bootstrap';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import './LoginPage.css';

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
            // Display the problem link as a clickable href.
            setMessage(
                <>
                    Challenge started! Please submit a compilation error for the following problem within 120 seconds:{' '}
                    <a href={res.data.problemLink} target="_blank" rel="noopener noreferrer">
                        {res.data.problemLink}
                    </a>
                </>
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
                // Save username and token to localStorage.
                localStorage.setItem('myHandle', username);
                localStorage.setItem('token', res.data.token);
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
        <div className="login-container">
            <div className="login-box">
                <h2 className="title">Login</h2>
                {!challenge ? (
                    <Form onSubmit={startLogin}>
                        {error && <Alert variant="danger">{error}</Alert>}
                        <Form.Group className="mb-3">
                            <Form.Label className='text'>Enter your Codeforces Handle:</Form.Label>
                            <Form.Control
                                type="text"
                                value={username}
                                onChange={(e) => setUsername(e.target.value)}
                            />
                        </Form.Group>
                        <Button className="login-button" variant="dark" type="submit" disabled={loading}>
                            {loading ? <Spinner animation="border" size="sm" /> : 'Start Login Challenge'}
                        </Button>
                    </Form>
                ) : (
                    <div>
                        {message && <Alert variant="info">{message}</Alert>}
                        <Button className="login-button" variant="outline-dark" onClick={checkChallenge} disabled={checkLoading}>
                            {checkLoading ? <Spinner animation="border" size="sm" /> : 'Check Challenge'}
                        </Button>
                    </div>
                )}
            </div>
        </div>
    );
}

export default LoginPage;
