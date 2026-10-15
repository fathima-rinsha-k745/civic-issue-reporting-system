import React from 'react';
import { Container, Row, Col, Card, Button } from 'react-bootstrap';
import { Link } from 'react-router-dom';
import { FaUser, FaBuilding, FaHardHat, FaCheckCircle, FaSearch, FaClipboardList, FaMapMarkerAlt, FaShieldAlt } from 'react-icons/fa';

const Home = () => {
  return (
    <div style={{ 
      minHeight: 'calc(100vh - 76px)',
      backgroundImage: 'linear-gradient(rgba(11, 27, 61, 0.7), rgba(11, 27, 61, 0.7)), url(/hero-civic.jpg)',
      backgroundSize: 'cover',
      backgroundPosition: 'center',
      backgroundAttachment: 'fixed',
      paddingBottom: '40px'
    }}>
      {/* Hero Section */}
      <div className="py-4 py-md-5" style={{ 
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'center'
      }}>
        <Container className="position-relative" style={{ zIndex: 1 }}>
          <Row className="mb-3 mb-md-4 text-center">
            <Col lg={10} className="mx-auto px-3">
              <h1 className="fw-bold text-white mb-2 mb-md-3" style={{ fontSize: 'clamp(1.75rem, 4vw, 2.75rem)', textShadow: '0 2px 4px rgba(0,0,0,0.3)', lineHeight: '1.2' }}>
                Civic Issue Reporting and Management System
              </h1>
              <p className="lead text-light mb-0" style={{ fontSize: 'clamp(1rem, 2vw, 1.25rem)', textShadow: '0 1px 3px rgba(0,0,0,0.3)' }}>
                A smarter way to report civic problems, track resolutions, and connect with your local municipal authorities.
              </p>
            </Col>
          </Row>

          <Row id="roles" className="justify-content-center g-3 g-md-4 mt-2 mt-md-4">
            {/* Citizen Card */}
            <Col xs={12} sm={6} md={4}>
              <Card 
                as={Link} 
                to="/citizen/login" 
                className="h-100 text-center text-decoration-none hover-card overflow-hidden glass-card glass-card-dark-text"
                style={{ cursor: 'pointer' }}
              >
                <Card.Body className="p-4 p-md-5 d-flex flex-column align-items-center justify-content-center">
                  <div className="mb-3 mb-md-4 text-white" style={{ fontSize: '2.8rem', filter: 'drop-shadow(0 2px 4px rgba(0,0,0,0.2))' }}>
                    <FaUser />
                  </div>
                  <h4 className="text-white fw-bold mb-2 mb-md-3">Citizen Portal</h4>
                  <p className="text-white opacity-75 small mb-0 fs-6">Report civic issues and track complaint progress.</p>
                </Card.Body>
              </Card>
            </Col>

            {/* Municipal Authority Card */}
            <Col xs={12} sm={6} md={4}>
              <Card 
                as={Link} 
                to="/authority/login" 
                className="h-100 text-center text-decoration-none hover-card overflow-hidden glass-card glass-card-dark-text"
                style={{ cursor: 'pointer' }}
              >
                <Card.Body className="p-4 p-md-5 d-flex flex-column align-items-center justify-content-center">
                  <div className="mb-3 mb-md-4 text-white" style={{ fontSize: '2.8rem', filter: 'drop-shadow(0 2px 4px rgba(0,0,0,0.2))' }}>
                    <FaBuilding />
                  </div>
                  <h4 className="text-white fw-bold mb-2 mb-md-3">Municipal Authority</h4>
                  <p className="text-white opacity-75 small mb-0 fs-6">Review complaints, assign departments, and monitor resolutions.</p>
                </Card.Body>
              </Card>
            </Col>

            {/* Department Staff Card */}
            <Col xs={12} sm={12} md={4}>
              <Card 
                as={Link} 
                to="/staff/login" 
                className="h-100 text-center text-decoration-none hover-card overflow-hidden glass-card glass-card-dark-text"
                style={{ cursor: 'pointer' }}
              >
                <Card.Body className="p-4 p-md-5 d-flex flex-column align-items-center justify-content-center">
                  <div className="mb-3 mb-md-4 text-white" style={{ fontSize: '2.8rem', filter: 'drop-shadow(0 2px 4px rgba(0,0,0,0.2))' }}>
                    <FaHardHat />
                  </div>
                  <h4 className="text-white fw-bold mb-2 mb-md-3">Department Staff</h4>
                  <p className="text-white opacity-75 small mb-0 fs-6">View assigned complaints and update their progress.</p>
                </Card.Body>
              </Card>
            </Col>
          </Row>
        </Container>
      </div>

      {/* How It Works Section */}
      <div className="py-4 py-md-5">
        <Container>
          <div className="text-center mb-4 mb-md-5 border-top border-light pt-4 pt-md-5">
            <h2 className="fw-bold text-white text-shadow-sm fs-2">How It Works</h2>
            <p className="text-light opacity-75">A simple, 4-step process to resolve civic issues</p>
          </div>
          <Row className="g-3 g-md-4">
            <Col xs={6} md={3} className="text-center">
              <div className="glass-card d-inline-flex align-items-center justify-content-center mb-3 text-white" style={{ width: '70px', height: '70px', borderRadius: '50% !important' }}>
                <FaMapMarkerAlt size={26} />
              </div>
              <h5 className="fw-bold text-white fs-6">1. Report an Issue</h5>
              <p className="text-light opacity-75 small mb-0">Submit the location and description.</p>
            </Col>
            <Col xs={6} md={3} className="text-center">
              <div className="glass-card d-inline-flex align-items-center justify-content-center mb-3 text-white" style={{ width: '70px', height: '70px', borderRadius: '50% !important' }}>
                <FaSearch size={26} />
              </div>
              <h5 className="fw-bold text-white fs-6">2. Authority Reviews</h5>
              <p className="text-light opacity-75 small mb-0">Authority verifies and assigns it.</p>
            </Col>
            <Col xs={6} md={3} className="text-center">
              <div className="glass-card d-inline-flex align-items-center justify-content-center mb-3 text-white" style={{ width: '70px', height: '70px', borderRadius: '50% !important' }}>
                <FaHardHat size={26} />
              </div>
              <h5 className="fw-bold text-white fs-6">3. Department Handles</h5>
              <p className="text-light opacity-75 small mb-0">Staff visit site and resolve issue.</p>
            </Col>
            <Col xs={6} md={3} className="text-center">
              <div className="glass-card d-inline-flex align-items-center justify-content-center mb-3 text-white" style={{ width: '70px', height: '70px', borderRadius: '50% !important' }}>
                <FaCheckCircle size={26} />
              </div>
              <h5 className="fw-bold text-white fs-6">4. Track Resolution</h5>
              <p className="text-light opacity-75 small mb-0">Stay updated on progress online.</p>
            </Col>
          </Row>
        </Container>
      </div>

      {/* Benefits Section */}
      <div className="py-4 py-md-5 mb-2 mb-md-4">
        <Container>
          <div className="text-center mb-4 mb-md-5 border-top border-light pt-4 pt-md-5">
            <h2 className="fw-bold text-white text-shadow-sm fs-2">Why Use CivicConnect?</h2>
            <p className="text-light opacity-75">Designed to streamline municipal operations and empower citizens</p>
          </div>
          <Row className="g-3 g-md-4">
            <Col xs={12} md={6}>
              <div className="d-flex align-items-start glass-card glass-card-dark-text p-3 p-sm-4 h-100 border-0">
                <FaClipboardList size={32} className="text-white me-3 me-sm-4 flex-shrink-0 mt-1" />
                <div>
                  <h5 className="fw-bold fs-6">Easy online complaint submission</h5>
                  <p className="text-light opacity-75 mb-0 small">Citizens can quickly submit complaints anytime, anywhere, with photos and precise location data.</p>
                </div>
              </div>
            </Col>
            <Col xs={12} md={6}>
              <div className="d-flex align-items-start glass-card glass-card-dark-text p-3 p-sm-4 h-100 border-0">
                <FaSearch size={32} className="text-white me-3 me-sm-4 flex-shrink-0 mt-1" />
                <div>
                  <h5 className="fw-bold fs-6">Transparent complaint status tracking</h5>
                  <p className="text-light opacity-75 mb-0 small">Track exactly what is happening with your reported issue in real-time.</p>
                </div>
              </div>
            </Col>
            <Col xs={12} md={6}>
              <div className="d-flex align-items-start glass-card glass-card-dark-text p-3 p-sm-4 h-100 border-0">
                <FaBuilding size={32} className="text-white me-3 me-sm-4 flex-shrink-0 mt-1" />
                <div>
                  <h5 className="fw-bold fs-6">Efficient department assignment</h5>
                  <p className="text-light opacity-75 mb-0 small">Authorities can route issues to the correct department immediately.</p>
                </div>
              </div>
            </Col>
            <Col xs={12} md={6}>
              <div className="d-flex align-items-start glass-card glass-card-dark-text p-3 p-sm-4 h-100 border-0">
                <FaShieldAlt size={32} className="text-white me-3 me-sm-4 flex-shrink-0 mt-1" />
                <div>
                  <h5 className="fw-bold fs-6">Centralized complaint management</h5>
                  <p className="text-light opacity-75 mb-0 small">All civic issues are stored in one secure system, ensuring nothing is lost or forgotten.</p>
                </div>
              </div>
            </Col>
          </Row>
        </Container>
      </div>
    </div>
  );
};

export default Home;
