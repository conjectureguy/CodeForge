// src/App.js
import React, { useState, useEffect } from 'react'; // Added useState, useEffect
import { BrowserRouter, Routes, Route, Link } from 'react-router-dom';
import { Navbar, Nav, Container } from 'react-bootstrap';
import HomePage from './components/HomePage';
import ProfilePage from './components/ProfilePage';
import FriendsPage from './components/FriendsPage';
import ComparisonPage from './components/ComparisonPage';
import ContestsPage from './components/ContestsPage'; // Placeholder
import ProblemsPage from './components/ProblemsPage';
import LoginPage from './components/LoginPage';
import ContestPage from './components/ContestPage'; // New custom contest page
import ContestDetailPage from './components/ContestDetailPage';
import BlogDetailPage from './components/BlogDetailPage';
// import { getCodeForcesProblems } from './api/codeforcesAPI';

function App() {
  // Added state to track login status based on the presence of a token
  const [isLoggedIn, setIsLoggedIn] = useState(!!localStorage.getItem('token'));

  // Update login state if localStorage changes (e.g., in another tab)
  useEffect(() => {
    const checkAuth = () => {
      setIsLoggedIn(!!localStorage.getItem('token'));
    };
    window.addEventListener('storage', checkAuth);
    return () => window.removeEventListener('storage', checkAuth);
  }, []);

  return (
    <BrowserRouter>
      <Navbar bg="dark" variant="dark" expand="lg">
        <Container>
          <Navbar.Brand as={Link} to="/">CodeForge</Navbar.Brand>
          <Navbar.Toggle aria-controls="forcecodes-navbar" />
          <Navbar.Collapse id="forcecodes-navbar">
            <Nav className="ms-auto">
              <Nav.Link as={Link} to="/">Home</Nav.Link>
              <Nav.Link as={Link} to="/contests">Contests</Nav.Link>
              <Nav.Link as={Link} to="/custom-contest">Custom Contest</Nav.Link>
              <Nav.Link as={Link} to="/problems">Problems</Nav.Link>
              <Nav.Link as={Link} to="/friends">My Friends</Nav.Link>
              <Nav.Link as={Link} to="/profile">Profile</Nav.Link>
              {/* Original Login link is now hidden if the user is logged in */}
              <Nav.Link 
                as={Link} 
                to="/login" 
                style={{ display: isLoggedIn ? 'none' : 'block' }}
              >
                Login
              </Nav.Link>
              {/* Conditionally render Logout link when logged in */}
              {isLoggedIn && (
                <Nav.Link
                  onClick={() => {
                    localStorage.removeItem('token');
                    localStorage.removeItem('myHandle');
                    setIsLoggedIn(false);
                    window.location.href = '/login';
                  }}
                >
                  Logout
                </Nav.Link>
              )}
            </Nav>
          </Navbar.Collapse>
        </Container>
      </Navbar>

      <Container className="mt-4">
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/login" element={<LoginPage />} />
          <Route path="/contests" element={<ContestsPage />} />
          <Route path="/custom-contest" element={<ContestPage />} />
          <Route path="/contest/:contestSlug" element={<ContestDetailPage />} />
          <Route path="/problems" element={<ProblemsPage />} />
          <Route path="/friends" element={<FriendsPage />} />
          <Route path="/profile" element={<ProfilePage />} />
          <Route path="/compare/:friendHandle" element={<ComparisonPage />} />
          <Route path="/blog/:postId" element={<BlogDetailPage />} />
        </Routes>
      </Container>
    </BrowserRouter>
  );
}

export default App;
