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
      paddingBottom: '60px'
    }}>
      {/* Hero Section */}
      <div style={{ 
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'center',
        padding: '60px 0'
      }}>
        <Container className="position-relative" style={{ zIndex: 1 }}>
          <Row className="mb-4 text-center">
            <Col lg={10} className="mx-auto">
              <h1 className="display-4 fw-bold text-white mb-3" style={{ textShadow: '0 2px 4px rgba(0,0,0,0.3)' }}>
                Civic Issue Reporting and Management System
              </h1>
              <p className="lead text-light mb-0 fs-4" style={{ textShadow: '0 1px 3px rgba(0,0,0,0.3)' }}>
                A smarter way to report civic problems, track resolutions, and connect with your local municipal authorities.
              </p>
            </Col>
          </Row>

          <Row id="roles" className="justify-content-center g-4 mt-4">
            {/* Citizen Card */}
            <Col md={4} lg={4}>
              <Card 
                as={Link} 
                to="/citizen/login" 
                className="h-100 text-center text-decoration-none hover-card overflow-hidden glass-card glass-card-dark-text"
                style={{ cursor: 'pointer' }}
              >
                <Card.Body className="p-5 d-flex flex-column align-items-center justify-content-center">
                  <div className="mb-4 text-white" style={{ fontSize: '3.5rem', filter: 'drop-shadow(0 2px 4px rgba(0,0,0,0.2))' }}>
                    <FaUser />
                  </div>
                  <h4 className="text-white fw-bold mb-3">Citizen Portal</h4>
                  <p className="text-white opacity-75 small mb-0 fs-6">Report civic issues and track complaint progress.</p>
                </Card.Body>
              </Card>
            </Col>

            {/* Municipal Authority Card */}
            <Col md={4} lg={4}>
              <Card 
                as={Link} 
                to="/authority/login" 
                className="h-100 text-center text-decoration-none hover-card overflow-hidden glass-card glass-card-dark-text"
                style={{ cursor: 'pointer' }}
              >
                <Card.Body className="p-5 d-flex flex-column align-items-center justify-content-center">
                  <div className="mb-4 text-white" style={{ fontSize: '3.5rem', filter: 'drop-shadow(0 2px 4px rgba(0,0,0,0.2))' }}>
                    <FaBuilding />
                  </div>
                  <h4 className="text-white fw-bold mb-3">Municipal Authority</h4>
                  <p className="text-white opacity-75 small mb-0 fs-6">Review complaints, assign departments, and monitor resolutions.</p>
                </Card.Body>
              </Card>
            </Col>

            {/* Department Staff Card */}
            <Col md={4} lg={4}>
              <Card 
                as={Link} 
                to="/staff/login" 
                className="h-100 text-center text-decoration-none hover-card overflow-hidden glass-card glass-card-dark-text"
                style={{ cursor: 'pointer' }}
              >
                <Card.Body className="p-5 d-flex flex-column align-items-center justify-content-center">
                  <div className="mb-4 text-white" style={{ fontSize: '3.5rem', filter: 'drop-shadow(0 2px 4px rgba(0,0,0,0.2))' }}>
                    <FaHardHat />
                  </div>
                  <h4 className="text-white fw-bold mb-3">Department Staff</h4>
                  <p className="text-white opacity-75 small mb-0 fs-6">View assigned complaints and update their progress.</p>
                </Card.Body>
              </Card>
            </Col>
          </Row>
        </Container>
      </div>

      {/* How It Works Section */}
      <div className="py-5">
        <Container>
          <div className="text-center mb-5 border-top border-light pt-5">
            <h2 className="fw-bold text-white text-shadow-sm">How It Works</h2>
            <p className="text-light opacity-75">A simple, 4-step process to resolve civic issues</p>
          </div>
          <Row className="g-4">
            <Col md={3} className="text-center">
              <div className="glass-card d-inline-flex align-items-center justify-content-center mb-3 text-white" style={{ width: '80px', height: '80px', borderRadius: '50% !important' }}>
                <FaMapMarkerAlt size={30} />
              </div>
              <h5 className="fw-bold text-white">1. Report an Issue</h5>
              <p className="text-light opacity-75 small">Submit the location and description of the problem.</p>
            </Col>
            <Col md={3} className="text-center">
              <div className="glass-card d-inline-flex align-items-center justify-content-center mb-3 text-white" style={{ width: '80px', height: '80px', borderRadius: '50% !important' }}>
                <FaSearch size={30} />
              </div>
              <h5 className="fw-bold text-white">2. Authority Reviews the Complaint</h5>
              <p className="text-light opacity-75 small">The municipal authority verifies and assigns it.</p>
            </Col>
            <Col md={3} className="text-center">
              <div className="glass-card d-inline-flex align-items-center justify-content-center mb-3 text-white" style={{ width: '80px', height: '80px', borderRadius: '50% !important' }}>
                <FaHardHat size={30} />
              </div>
              <h5 className="fw-bold text-white">3. Department Handles the Issue</h5>
              <p className="text-light opacity-75 small">Assigned staff visit the site and perform the necessary work.</p>
            </Col>
            <Col md={3} className="text-center">
              <div className="glass-card d-inline-flex align-items-center justify-content-center mb-3 text-white" style={{ width: '80px', height: '80px', borderRadius: '50% !important' }}>
                <FaCheckCircle size={30} />
              </div>
              <h5 className="fw-bold text-white">4. Track the Resolution</h5>
              <p className="text-light opacity-75 small">Stay updated on the progress until it's resolved.</p>
            </Col>
          </Row>
        </Container>
      </div>

      {/* Benefits Section */}
      <div className="py-5 mb-4">
        <Container>
          <div className="text-center mb-5 border-top border-light pt-5">
            <h2 className="fw-bold text-white text-shadow-sm">Why Use CivicConnect?</h2>
            <p className="text-light opacity-75">Designed to streamline municipal operations and empower citizens</p>
          </div>
          <Row className="g-4">
            <Col md={6}>
              <div className="d-flex align-items-start glass-card glass-card-dark-text p-4 h-100 border-0">
                <FaClipboardList size={40} className="text-white me-4 flex-shrink-0" />
                <div>
                  <h5 className="fw-bold">Easy online complaint submission</h5>
                  <p className="text-light opacity-75 mb-0">Citizens can quickly submit complaints anytime, anywhere, with photos and precise location data.</p>
                </div>
              </div>
            </Col>
            <Col md={6}>
              <div className="d-flex align-items-start glass-card glass-card-dark-text p-4 h-100 border-0">
                <FaSearch size={40} className="text-white me-4 flex-shrink-0" />
                <div>
                  <h5 className="fw-bold">Transparent complaint status tracking</h5>
                  <p className="text-light opacity-75 mb-0">Track exactly what is happening with your reported issue in real-time.</p>
                </div>
              </div>
            </Col>
            <Col md={6}>
              <div className="d-flex align-items-start glass-card glass-card-dark-text p-4 h-100 border-0">
                <FaBuilding size={40} className="text-white me-4 flex-shrink-0" />
                <div>
                  <h5 className="fw-bold">Efficient department assignment</h5>
                  <p className="text-light opacity-75 mb-0">Authorities can route issues to the correct department immediately.</p>
                </div>
              </div>
            </Col>
            <Col md={6}>
              <div className="d-flex align-items-start glass-card glass-card-dark-text p-4 h-100 border-0">
                <FaShieldAlt size={40} className="text-white me-4 flex-shrink-0" />
                <div>
                  <h5 className="fw-bold">Centralized complaint management</h5>
                  <p className="text-light opacity-75 mb-0">All civic issues are stored in one secure system, ensuring nothing is lost or forgotten.</p>
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
