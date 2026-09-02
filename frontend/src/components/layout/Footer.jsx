import React from 'react';
import { Container, Row, Col } from 'react-bootstrap';
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
              A collaborative platform for citizens and municipal authorities to report, track, and manage civic issues efficiently and build a better community for everyone.
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
              <li><a href="/" className="footer-link">Home</a></li>
              <li><a href="#about" className="footer-link">About Us</a></li>
              <li><a href="#services" className="footer-link">Services</a></li>
              <li><a href="#contact" className="footer-link">Contact</a></li>
            </ul>
          </Col>

          <Col lg={2} md={6}>
            <h5 className="footer-heading">Services</h5>
            <ul className="list-unstyled">
              <li><a href="/register" className="footer-link">Report Issue</a></li>
              <li><a href="/login" className="footer-link">Track Status</a></li>
              <li><a href="#feedback" className="footer-link">Give Feedback</a></li>
              <li><a href="#help" className="footer-link">Help Center</a></li>
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
