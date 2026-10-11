import React from 'react';
import { Container, Row, Col } from 'react-bootstrap';
import { Link } from 'react-router-dom';
import { FaLandmark, FaFacebookF, FaTwitter, FaInstagram, FaLinkedinIn } from 'react-icons/fa';

const Footer = () => {
  return (
    <footer className="footer-section">
      <Container>
        <Row className="gy-4">
          <Col lg={4} md={6}>
            <div className="d-flex align-items-center mb-3">
              <FaLandmark size={24} className="me-2 text-white" />
              <h4 className="mb-0 text-white font-weight-bold">CivicConnect</h4>
            </div>
            <p className="footer-text mb-4">
              Report Issues. Track Progress. Build Better Communities.
            </p>
            <div className="d-flex gap-3">
              <a href="#!" className="text-white bg-secondary bg-opacity-25 p-2 rounded-circle d-flex align-items-center justify-content-center" style={{width: '35px', height: '35px'}}>
                <FaFacebookF size={14} />
              </a>
              <a href="#!" className="text-white bg-secondary bg-opacity-25 p-2 rounded-circle d-flex align-items-center justify-content-center" style={{width: '35px', height: '35px'}}>
                <FaTwitter size={14} />
              </a>
              <a href="#!" className="text-white bg-secondary bg-opacity-25 p-2 rounded-circle d-flex align-items-center justify-content-center" style={{width: '35px', height: '35px'}}>
                <FaInstagram size={14} />
              </a>
              <a href="#!" className="text-white bg-secondary bg-opacity-25 p-2 rounded-circle d-flex align-items-center justify-content-center" style={{width: '35px', height: '35px'}}>
                <FaLinkedinIn size={14} />
              </a>
            </div>
          </Col>
          
          <Col lg={2} md={6} className="offset-lg-1">
            <h5 className="footer-heading">Quick Links</h5>
            <ul className="list-unstyled">
              <li><Link to="/" className="footer-link">Home</Link></li>
              <li><Link to="/about" className="footer-link">About Us</Link></li>
              <li><Link to="/services" className="footer-link">Services</Link></li>
              <li><Link to="/contact" className="footer-link">Contact Us</Link></li>
            </ul>
          </Col>

          <Col lg={2} md={6}>
            <h5 className="footer-heading">Services</h5>
            <ul className="list-unstyled">
              <li><Link to="/citizen/login" className="footer-link">Report Issue</Link></li>
              <li><Link to="/citizen/login" className="footer-link">Track Status</Link></li>
              <li><Link to="/authority/login" className="footer-link">Authority Portal</Link></li>
              <li><Link to="/staff/login" className="footer-link">Staff Portal</Link></li>
            </ul>
          </Col>

          <Col lg={3} md={6}>
            <h5 className="footer-heading">Contact Info</h5>
            <ul className="list-unstyled footer-text">
              <li className="mb-2"><strong>Address:</strong><br />123 Civic Center Drive,<br />Municipal Building, City 40001</li>
              <li className="mb-2"><strong>Phone:</strong><br />+91 98765 43210</li>
              <li className="mb-2"><strong>Email:</strong><br />support@civicportal.in</li>
            </ul>
          </Col>
        </Row>
        
        <div className="footer-bottom">
          <p className="mb-0">&copy; {new Date().getFullYear()} CivicConnect Platform. All Rights Reserved.</p>
        </div>
      </Container>
    </footer>
  );
};

export default Footer;
