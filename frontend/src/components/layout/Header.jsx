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
      <div className="top-header py-2 d-none d-sm-block">
        <Container className="d-flex justify-content-between align-items-center flex-wrap gap-2">
          <div className="d-flex gap-3 gap-md-4 flex-wrap">
            <span><FaPhoneAlt className="me-2" /> +91 98765 43210</span>
            <span className="d-none d-md-inline"><FaEnvelope className="me-2" /> support@civicportal.in</span>
          </div>
          <div className="d-flex gap-3">
            <a href="#!" aria-label="Facebook"><FaFacebookF /></a>
            <a href="#!" aria-label="Twitter"><FaTwitter /></a>
            <a href="#!" aria-label="Instagram"><FaInstagram /></a>
            <a href="#!" aria-label="YouTube"><FaYoutube /></a>
          </div>
        </Container>
      </div>

      {/* Main Navbar */}
      <Navbar bg="white" expand="lg" collapseOnSelect className="py-2 py-md-3 sticky-top">
        <Container>
          <Navbar.Brand as={Link} to="/" className="d-flex align-items-center">
            <FaLandmark size={26} className="me-2" />
            <span className="fw-bold">CivicConnect</span>
          </Navbar.Brand>
          <Navbar.Toggle aria-controls="basic-navbar-nav" />
          <Navbar.Collapse id="basic-navbar-nav">
            <Nav className="mx-auto text-center mt-3 mt-lg-0">
              <Nav.Link as={Link} to="/" className={currentPath === '/' ? 'active py-2' : 'py-2'}>Home</Nav.Link>
              <Nav.Link as={Link} to="/about" className={currentPath === '/about' ? 'active py-2' : 'py-2'}>About Us</Nav.Link>
              <Nav.Link as={Link} to="/services" className={currentPath === '/services' ? 'active py-2' : 'py-2'}>Services</Nav.Link>
              <Nav.Link as={Link} to="/contact" className={currentPath === '/contact' ? 'active py-2' : 'py-2'}>Contact Us</Nav.Link>
            </Nav>
          </Navbar.Collapse>
        </Container>
      </Navbar>
    </>
  );
};

export default Header;
