import React from 'react';
import { Container, Row, Col, Card } from 'react-bootstrap';
import { Link } from 'react-router-dom';
import { FaUser, FaBuilding, FaHardHat } from 'react-icons/fa';

const Home = () => {
  return (
    <div style={{ 
      minHeight: 'calc(100vh - 76px)', // Adjusting roughly for header height
      backgroundImage: 'linear-gradient(rgba(11, 27, 61, 0.7), rgba(11, 27, 61, 0.7)), url(/hero-civic.jpg)',
      backgroundSize: 'cover',
      backgroundPosition: 'center',
      backgroundAttachment: 'fixed',
      display: 'flex',
      flexDirection: 'column',
      justifyContent: 'center',
      padding: '60px 0'
    }}>
      <Container className="position-relative" style={{ zIndex: 1 }}>
        <Row className="mb-5 text-center">
          <Col lg={10} className="mx-auto">
            <h1 className="display-4 fw-bold text-white mb-3" style={{ textShadow: '0 2px 4px rgba(0,0,0,0.3)' }}>
              Civic Issue Reporting and Management System
            </h1>
            <p className="lead text-light mb-0 fs-4" style={{ textShadow: '0 1px 3px rgba(0,0,0,0.3)' }}>
              A unified municipal platform connecting citizens, authorities, and department staff to resolve civic issues efficiently and transparently.
            </p>
          </Col>
        </Row>

        <Row className="justify-content-center g-4 mt-2">
          {/* Citizen Card */}
          <Col md={4} lg={4}>
            <Card 
              as={Link} 
              to="/citizen/login" 
              className="h-100 text-center text-decoration-none hover-card overflow-hidden"
              style={{ 
                background: 'rgba(255, 255, 255, 0.15)',
                backdropFilter: 'blur(12px)',
                WebkitBackdropFilter: 'blur(12px)',
                border: '1px solid rgba(255, 255, 255, 0.3)',
                boxShadow: '0 8px 32px 0 rgba(0, 0, 0, 0.2)',
                borderRadius: '16px',
                transition: 'transform 0.3s ease, background 0.3s ease',
                cursor: 'pointer' 
              }}
              onMouseOver={(e) => {
                e.currentTarget.style.transform = 'translateY(-8px)';
                e.currentTarget.style.background = 'rgba(255, 255, 255, 0.25)';
              }}
              onMouseOut={(e) => {
                e.currentTarget.style.transform = 'translateY(0)';
                e.currentTarget.style.background = 'rgba(255, 255, 255, 0.15)';
              }}
            >
              <Card.Body className="p-5 d-flex flex-column align-items-center justify-content-center">
                <div className="mb-4 text-white" style={{ fontSize: '3.5rem', filter: 'drop-shadow(0 2px 4px rgba(0,0,0,0.2))' }}>
                  <FaUser />
                </div>
                <h4 className="text-white fw-bold mb-3">Citizen Portal</h4>
                <p className="text-white opacity-75 small mb-0 fs-6">Report new issues and track the status of your complaints.</p>
              </Card.Body>
            </Card>
          </Col>

          {/* Municipal Authority Card */}
          <Col md={4} lg={4}>
            <Card 
              as={Link} 
              to="/authority/login" 
              className="h-100 text-center text-decoration-none hover-card overflow-hidden"
              style={{ 
                background: 'rgba(255, 255, 255, 0.15)',
                backdropFilter: 'blur(12px)',
                WebkitBackdropFilter: 'blur(12px)',
                border: '1px solid rgba(255, 255, 255, 0.3)',
                boxShadow: '0 8px 32px 0 rgba(0, 0, 0, 0.2)',
                borderRadius: '16px',
                transition: 'transform 0.3s ease, background 0.3s ease',
                cursor: 'pointer' 
              }}
              onMouseOver={(e) => {
                e.currentTarget.style.transform = 'translateY(-8px)';
                e.currentTarget.style.background = 'rgba(255, 255, 255, 0.25)';
              }}
              onMouseOut={(e) => {
                e.currentTarget.style.transform = 'translateY(0)';
                e.currentTarget.style.background = 'rgba(255, 255, 255, 0.15)';
              }}
            >
              <Card.Body className="p-5 d-flex flex-column align-items-center justify-content-center">
                <div className="mb-4 text-white" style={{ fontSize: '3.5rem', filter: 'drop-shadow(0 2px 4px rgba(0,0,0,0.2))' }}>
                  <FaBuilding />
                </div>
                <h4 className="text-white fw-bold mb-3">Municipal Authority</h4>
                <p className="text-white opacity-75 small mb-0 fs-6">Manage civic issues, oversee operations, and assign departments.</p>
              </Card.Body>
            </Card>
          </Col>

          {/* Department Staff Card */}
          <Col md={4} lg={4}>
            <Card 
              as={Link} 
              to="/staff/login" 
              className="h-100 text-center text-decoration-none hover-card overflow-hidden"
              style={{ 
                background: 'rgba(255, 255, 255, 0.15)',
                backdropFilter: 'blur(12px)',
                WebkitBackdropFilter: 'blur(12px)',
                border: '1px solid rgba(255, 255, 255, 0.3)',
                boxShadow: '0 8px 32px 0 rgba(0, 0, 0, 0.2)',
                borderRadius: '16px',
                transition: 'transform 0.3s ease, background 0.3s ease',
                cursor: 'pointer' 
              }}
              onMouseOver={(e) => {
                e.currentTarget.style.transform = 'translateY(-8px)';
                e.currentTarget.style.background = 'rgba(255, 255, 255, 0.25)';
              }}
              onMouseOut={(e) => {
                e.currentTarget.style.transform = 'translateY(0)';
                e.currentTarget.style.background = 'rgba(255, 255, 255, 0.15)';
              }}
            >
              <Card.Body className="p-5 d-flex flex-column align-items-center justify-content-center">
                <div className="mb-4 text-white" style={{ fontSize: '3.5rem', filter: 'drop-shadow(0 2px 4px rgba(0,0,0,0.2))' }}>
                  <FaHardHat />
                </div>
                <h4 className="text-white fw-bold mb-3">Department Staff</h4>
                <p className="text-white opacity-75 small mb-0 fs-6">Review assigned tasks and update the resolution status.</p>
              </Card.Body>
            </Card>
          </Col>
        </Row>
      </Container>
    </div>
  );
};

export default Home;
