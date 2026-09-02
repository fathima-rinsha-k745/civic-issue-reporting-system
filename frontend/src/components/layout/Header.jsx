import React from 'react';
import { Navbar, Nav, Container, Button } from 'react-bootstrap';
import { Link, useLocation } from 'react-router-dom';
import { FaPhoneAlt, FaEnvelope, FaFacebookF, FaTwitter, FaInstagram, FaYoutube, FaLandmark } from 'react-icons/fa';

const Header = () => {
  const location = useLocation();
  const currentPath = location.pathname;

  return (
    <>
      {/* Top Header */}
      <div className="top-header py-2">
        <Container className="d-flex justify-content-between align-items-center">
          <div className="d-flex gap-4">
            <span><FaPhoneAlt className="me-2" /> +91 98765 43210</span>
            <span><FaEnvelope className="me-2" /> support@civicportal.in</span>
          </div>
          <div className="d-flex gap-3">
            <a href="#!"><FaFacebookF /></a>
            <a href="#!"><FaTwitter /></a>
            <a href="#!"><FaInstagram /></a>
            <a href="#!"><FaYoutube /></a>
          </div>
        </Container>
      </div>

      {/* Main Navbar */}
      <Navbar bg="white" expand="lg" className="py-3 sticky-top">
        <Container>
          <Navbar.Brand as={Link} to="/">
            <FaLandmark size={30} className="me-2" />
            CivicConnect
          </Navbar.Brand>
          <Navbar.Toggle aria-controls="basic-navbar-nav" />
          <Navbar.Collapse id="basic-navbar-nav">
            <Nav className="mx-auto">
              <Nav.Link as={Link} to="/" className={currentPath === '/' ? 'active' : ''}>Home</Nav.Link>
              <Nav.Link href="#about">About Us</Nav.Link>
              <Nav.Link href="#services">Services</Nav.Link>
              <Nav.Link href="#contact">Contact Us</Nav.Link>
            </Nav>
            <Nav className="d-flex gap-2 align-items-center">
              <Button as={Link} to="/login" variant="outline-green" className="px-4">Login</Button>
              <Button as={Link} to="/register" variant="primary-green" className="px-4">Register</Button>
            </Nav>
          </Navbar.Collapse>
        </Container>
      </Navbar>
    </>
  );
};

export default Header;
