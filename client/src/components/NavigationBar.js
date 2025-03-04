// src/NavigationBar.js
import React from 'react';
import { Navbar, Nav, Container } from 'react-bootstrap';
import { Link } from 'react-router-dom';

function NavigationBar() {
  // Check if token exists in localStorage to determine login state.
  const token = localStorage.getItem('token');

  const handleLogout = () => {
    // Clear the authentication data.
    localStorage.removeItem('token');
    localStorage.removeItem('myHandle');
    // Redirect to the login page.
    window.location.href = '/login';
  };

  return (
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
            { token ? (
              <Nav.Link onClick={handleLogout}>Logout</Nav.Link>
            ) : (
              <Nav.Link as={Link} to="/login">Login</Nav.Link>
            )}
          </Nav>
        </Navbar.Collapse>
      </Container>
    </Navbar>
  );
}

export default NavigationBar;
