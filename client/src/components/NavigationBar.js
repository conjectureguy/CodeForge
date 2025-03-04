// src/NavigationBar.js
import React from 'react';
import { Navbar, Nav, Container } from 'react-bootstrap';
import { LinkContainer } from 'react-router-bootstrap';

function NavigationBar() {
    return (
        <Navbar bg="dark" variant="dark" expand="lg">
            <Container>
                <LinkContainer to="/">
                    <Navbar.Brand>CodeForge</Navbar.Brand>
                </LinkContainer>
                <Navbar.Toggle aria-controls="cf-navbar" />
                <Navbar.Collapse id="cf-navbar">
                    <Nav className="ms-auto">
                        <LinkContainer to="/">
                            <Nav.Link>Home</Nav.Link>
                        </LinkContainer>
                        <LinkContainer to="/create-mashup">
                            <Nav.Link>Create Mashup</Nav.Link>
                        </LinkContainer>
                        <LinkContainer to="/teams">
                            <Nav.Link>Teams</Nav.Link>
                        </LinkContainer>
                        <LinkContainer to="/contests">
                            <Nav.Link>Contests</Nav.Link>
                        </LinkContainer>
                        <LinkContainer to="/problems">
                            <Nav.Link>Problems</Nav.Link>
                        </LinkContainer>
                        <LinkContainer to="/profile">
                            <Nav.Link>Profile</Nav.Link>
                        </LinkContainer>
                        <LinkContainer to="/my-friends">
                            <Nav.Link>My Friends</Nav.Link>
                        </LinkContainer>
                    </Nav>
                </Navbar.Collapse>
            </Container>
        </Navbar>
    );
}

export default NavigationBar;
