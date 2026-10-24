import React from 'react';
import { Container, Row, Col } from 'react-bootstrap';
import { Link } from 'react-router-dom';
import { FaLandmark, FaFacebookF, FaInstagram, FaYoutube, FaLinkedinIn } from 'react-icons/fa';

const Footer = () => {
  return (
    <footer className="footer-section">
      <Container>
        <Row className="gy-4 align-items-start">
          {/* Brand & Tagline */}
          <Col lg={4} md={6}>
            <div className="d-flex align-items-center mb-2">
              <div className="civic-brand-icon-box me-2 d-flex align-items-center justify-content-center">
                <FaLandmark size={20} className="text-white" />
              </div>
              <span className="civic-brand-text fs-4">
                Civic<span className="civic-brand-accent">Connect</span>
              </span>
            </div>
            <p className="footer-text mb-0" style={{ fontSize: '0.88rem', color: 'rgba(255, 255, 255, 0.65)' }}>
              Together for a Cleaner, Greener and Healthier City.
            </p>
          </Col>

          {/* Quick Links */}
          <Col lg={3} sm={6} xs={6} className="offset-lg-0">
            <h5 className="footer-heading" style={{ fontSize: '0.95rem', fontWeight: 600, color: '#ffffff', marginBottom: '14px' }}>
              Quick Links
            </h5>
            <div className="row g-2">
              <div className="col-6">
                <ul className="list-unstyled mb-0 d-flex flex-column gap-2" style={{ fontSize: '0.88rem' }}>
                  <li><Link to="/" className="footer-link">Home</Link></li>
                  <li><Link to="/about" className="footer-link">About Us</Link></li>
                </ul>
              </div>
              <div className="col-6">
                <ul className="list-unstyled mb-0 d-flex flex-column gap-2" style={{ fontSize: '0.88rem' }}>
                  <li><Link to="/services" className="footer-link">Services</Link></li>
                  <li><Link to="/contact" className="footer-link">Contact Us</Link></li>
                </ul>
              </div>
            </div>
          </Col>

          {/* Our Services */}
          <Col lg={3} sm={6} xs={6}>
            <h5 className="footer-heading" style={{ fontSize: '0.95rem', fontWeight: 600, color: '#ffffff', marginBottom: '14px' }}>
              Our Services
            </h5>
            <div className="row g-2">
              <div className="col-6">
                <ul className="list-unstyled mb-0 d-flex flex-column gap-2" style={{ fontSize: '0.88rem' }}>
                  <li><Link to="/citizen/login" state={{ redirectTo: '/dashboard/citizen/report' }} className="footer-link">Report an Issue</Link></li>
                  <li><Link to="/citizen/login" state={{ redirectTo: '/dashboard/citizen/complaints' }} className="footer-link">Track My Issue</Link></li>
                </ul>
              </div>
              <div className="col-6">
                <ul className="list-unstyled mb-0 d-flex flex-column gap-2" style={{ fontSize: '0.88rem' }}>
                  <li><Link to="/authority/login" className="footer-link">Municipal Authority</Link></li>
                  <li><Link to="/staff/login" className="footer-link">Department Staff</Link></li>
                </ul>
              </div>
            </div>
          </Col>

          {/* Follow Us */}
          <Col lg={2} md={6}>
            <h5 className="footer-heading" style={{ fontSize: '0.95rem', fontWeight: 600, color: '#ffffff', marginBottom: '14px' }}>
              Follow Us
            </h5>
            <div className="d-flex gap-2">
              <a
                href="#!"
                aria-label="Facebook"
                className="civic-social-btn text-white text-decoration-none d-flex align-items-center justify-content-center"
              >
                <FaFacebookF size={13} />
              </a>
              <a
                href="#!"
                aria-label="Instagram"
                className="civic-social-btn text-white text-decoration-none d-flex align-items-center justify-content-center"
              >
                <FaInstagram size={13} />
              </a>
              <a
                href="#!"
                aria-label="YouTube"
                className="civic-social-btn text-white text-decoration-none d-flex align-items-center justify-content-center"
              >
                <FaYoutube size={13} />
              </a>
              <a
                href="#!"
                aria-label="LinkedIn"
                className="civic-social-btn text-white text-decoration-none d-flex align-items-center justify-content-center"
              >
                <FaLinkedinIn size={13} />
              </a>
            </div>
          </Col>
        </Row>
      </Container>
    </footer>
  );
};

export default Footer;
