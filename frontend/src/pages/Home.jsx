import React from 'react';
import { Container, Row, Col, Button } from 'react-bootstrap';
import { Link } from 'react-router-dom';
import { FaCheckCircle, FaSearch, FaClipboardList, FaClock, FaUsers, FaShieldAlt, FaUserCircle, FaEdit, FaTasks } from 'react-icons/fa';
import heroImage from '../assets/hero_city_park.jpg';

const Home = () => {
  return (
    <>
      {/* Hero Section */}
      <section className="hero-section">
        <Container>
          <Row className="align-items-center">
            <Col lg={6} className="mb-5 mb-lg-0 pe-lg-5">
              <h1 className="hero-title">Report Issues.</h1>
              <h2 className="hero-subtitle">Build a Better City.</h2>
              <p className="hero-text">
                Report civic issues in your area and help us build a cleaner, safer and better community for all.
              </p>
              <div className="d-flex flex-wrap gap-3">
                <Button as={Link} to="/register" variant="primary-green" className="d-flex align-items-center">
                  <FaEdit className="me-2" /> Report an Issue
                </Button>
                <Button as={Link} to="/login" variant="outline-green" className="d-flex align-items-center">
                  <FaSearch className="me-2" /> Track Complaint
                </Button>
              </div>
            </Col>
            <Col lg={6} className="text-center hero-image-container">
              {/* Replace with actual illustration if available */}
              <img src={heroImage} alt="City Park Illustration" className="img-fluid rounded" />
            </Col>
          </Row>
        </Container>
      </section>

      {/* Features Section */}
      <section className="features-section">
        <Container>
          <Row className="g-4">
            <Col lg={3} md={6}>
              <div className="feature-item">
                <div className="feature-icon-wrapper">
                  <FaClipboardList />
                </div>
                <div>
                  <h4 className="feature-title">Easy Reporting</h4>
                  <p className="feature-text">Report issues quickly and easily.</p>
                </div>
              </div>
            </Col>
            <Col lg={3} md={6}>
              <div className="feature-item">
                <div className="feature-icon-wrapper">
                  <FaClock />
                </div>
                <div>
                  <h4 className="feature-title">Track Status</h4>
                  <p className="feature-text">Track the status of your complaint in real-time.</p>
                </div>
              </div>
            </Col>
            <Col lg={3} md={6}>
              <div className="feature-item">
                <div className="feature-icon-wrapper">
                  <FaUsers />
                </div>
                <div>
                  <h4 className="feature-title">Community Driven</h4>
                  <p className="feature-text">Together we can make our city better.</p>
                </div>
              </div>
            </Col>
            <Col lg={3} md={6}>
              <div className="feature-item">
                <div className="feature-icon-wrapper">
                  <FaShieldAlt />
                </div>
                <div>
                  <h4 className="feature-title">Secure & Reliable</h4>
                  <p className="feature-text">Your data is safe and secure.</p>
                </div>
              </div>
            </Col>
          </Row>
        </Container>
      </section>

      {/* How It Works Section */}
      <section className="how-it-works-section">
        <Container>
          <h2 className="section-title">How It Works</h2>
          <Row className="g-4 mt-2">
            <Col lg={3} md={6}>
              <div className="step-card">
                <div className="step-icon-wrapper">
                  <FaUserCircle />
                </div>
                <h3 className="step-title">
                  <span className="step-number">01</span> Register / Login
                </h3>
                <p className="step-text">
                  Create an account or login to your existing account.
                </p>
              </div>
            </Col>
            <Col lg={3} md={6}>
              <div className="step-card">
                <div className="step-icon-wrapper">
                  <FaEdit />
                </div>
                <h3 className="step-title">
                  <span className="step-number">02</span> Report an Issue
                </h3>
                <p className="step-text">
                  Provide details and location of the issue.
                </p>
              </div>
            </Col>
            <Col lg={3} md={6}>
              <div className="step-card">
                <div className="step-icon-wrapper">
                  <FaTasks />
                </div>
                <h3 className="step-title">
                  <span className="step-number">03</span> Track Status
                </h3>
                <p className="step-text">
                  Track the status of your complaint.
                </p>
              </div>
            </Col>
            <Col lg={3} md={6}>
              <div className="step-card">
                <div className="step-icon-wrapper">
                  <FaCheckCircle />
                </div>
                <h3 className="step-title">
                  <span className="step-number">04</span> Issue Resolved
                </h3>
                <p className="step-text">
                  Authorities will resolve the issue and update you.
                </p>
              </div>
            </Col>
          </Row>
        </Container>
      </section>
    </>
  );
};

export default Home;
