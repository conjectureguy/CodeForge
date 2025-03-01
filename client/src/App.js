// src/App.js
import React from 'react';
import { BrowserRouter, Routes, Route, Link } from 'react-router-dom';
import { Navbar, Nav, Container } from 'react-bootstrap';
import HomePage from './components/HomePage';
import ProfilePage from './components/ProfilePage';
import FriendsPage from './components/FriendsPage';
import ComparisonPage from './components/ComparisonPage';
import ContestsPage from './components/ContestsPage'; // Placeholder
import ProblemsPage from './components/ProblemsPage';
import LoginPage from './components/LoginPage';
// import { getCodeForcesProblems } from './api/codeforcesAPI';

function App() {
  return (
    <BrowserRouter>
      <Navbar bg="dark" variant="dark" expand="lg">
        <Container>
          <Navbar.Brand as={Link} to="/">ForceCodes</Navbar.Brand>
          <Navbar.Toggle aria-controls="forcecodes-navbar" />
          <Navbar.Collapse id="forcecodes-navbar">
            <Nav className="ms-auto">
              <Nav.Link as={Link} to="/">Home</Nav.Link>
              
              <Nav.Link as={Link} to="/contests">Contests</Nav.Link>
              <Nav.Link as={Link} to="/problems">Problems</Nav.Link>
              <Nav.Link as={Link} to="/friends">My Friends</Nav.Link>
              <Nav.Link as={Link} to="/profile">Profile</Nav.Link>
              {/* <Nav.Link as={Link} to="/create-contest">createContest</Nav.Link> */}
              <Nav.Link as={Link} to="/login">Login</Nav.Link>
            </Nav>
          </Navbar.Collapse>
        </Container>
      </Navbar>
      
      <Container className="mt-4">
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/login" element={<LoginPage />} />
          <Route path="/contests" element={<ContestsPage />} />
          <Route path="/problems" element={<ProblemsPage />} />
          <Route path="/friends" element={<FriendsPage />} />
          <Route path="/profile" element={<ProfilePage />} />
          {/* <Route path="/create-contest" element={<ContestCreationForm />} /> */}
          <Route path="/compare/:friendHandle" element={<ComparisonPage />} />
        </Routes>
      </Container>
    </BrowserRouter>
  );
}

export default App;
