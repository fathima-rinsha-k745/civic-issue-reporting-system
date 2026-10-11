import React from 'react';
import { Container, Row, Col, Card } from 'react-bootstrap';
import { FaBullseye, FaFlag, FaCogs, FaMapMarkerAlt, FaSearch, FaHardHat, FaCheckCircle } from 'react-icons/fa';

const About = () => {
  return (
    <div style={{ 
      minHeight: 'calc(100vh - 76px)',
      backgroundImage: 'linear-gradient(rgba(11, 27, 61, 0.7), rgba(11, 27, 61, 0.7)), url(/hero-civic.jpg)',
      backgroundSize: 'cover',
      backgroundPosition: 'center',
      backgroundAttachment: 'fixed',
      padding: '40px 0'
    }}>
      <Container>
        <div className="text-center mb-5 pt-3">
          <h1 className="fs-main-heading text-white text-shadow-sm mb-3">About CivicConnect</h1>
          <p className="fs-body-text text-light mx-auto" style={{ maxWidth: '800px', opacity: 0.9 }}>
            CivicConnect is a web-based platform for citizens to report civic problems and help municipal authorities manage and resolve them.
          </p>
        </div>

        <Row className="g-4 mb-5">
          <Col md={4}>
            <Card className="h-100 border-0 glass-card glass-card-dark-text">
              <Card.Body className="p-4 text-center">
                <div className="mb-3" style={{ fontSize: '2rem', opacity: 0.9 }}>
                  <FaFlag />
                </div>
                <h3 className="fs-card-heading mb-3">Our Mission</h3>
                <p className="fs-body-text mb-0 opacity-75">
                  Make civic issue reporting easier, improve transparency, and support better communication between citizens and local authorities.
                </p>
              </Card.Body>
            </Card>
          </Col>

          <Col md={4}>
            <Card className="h-100 border-0 glass-card glass-card-dark-text">
              <Card.Body className="p-4 text-center">
                <div className="mb-3" style={{ fontSize: '2rem', opacity: 0.9 }}>
                  <FaCogs />
                </div>
                <h3 className="fs-card-heading mb-3">Our Objectives</h3>
                <p className="fs-body-text mb-0 opacity-75">
                  Simplify complaint submission, enable complaint tracking, improve departmental coordination, and monitor resolution progress.
                </p>
              </Card.Body>
            </Card>
          </Col>
          
          <Col md={4}>
            <Card className="h-100 border-0 glass-card glass-card-dark-text">
              <Card.Body className="p-4 text-center">
                <div className="mb-3" style={{ fontSize: '2rem', opacity: 0.9 }}>
                  <FaBullseye />
                </div>
                <h3 className="fs-card-heading mb-3">Who We Serve</h3>
                <p className="fs-body-text mb-0 opacity-75">
                  Designed for Citizens to report issues, Municipal Authorities to manage operations, and Department Staff to resolve tasks.
                </p>
              </Card.Body>
            </Card>
          </Col>
        </Row>

        {/* How It Works Section */}
        <div className="mt-5 pt-4">
          <div className="text-center mb-4">
            <h2 className="fs-section-heading text-white">How It Works</h2>
          </div>
          <Row className="g-4 text-center">
            <Col xs={6} md={3}>
              <div className="glass-card p-3 h-100 glass-card-dark-text d-flex flex-column align-items-center justify-content-center">
                <FaMapMarkerAlt size={24} className="mb-2" />
                <h5 className="fs-card-heading mb-2">1. Report Issue</h5>
                <p className="fs-body-text mb-0 opacity-75">Submit a civic problem.</p>
              </div>
            </Col>
            <Col xs={6} md={3}>
              <div className="glass-card p-3 h-100 glass-card-dark-text d-flex flex-column align-items-center justify-content-center">
                <FaSearch size={24} className="mb-2" />
                <h5 className="fs-card-heading mb-2">2. Authority Reviews</h5>
                <p className="fs-body-text mb-0 opacity-75">Assigned to a department.</p>
              </div>
            </Col>
            <Col xs={6} md={3}>
              <div className="glass-card p-3 h-100 glass-card-dark-text d-flex flex-column align-items-center justify-content-center">
                <FaHardHat size={24} className="mb-2" />
                <h5 className="fs-card-heading mb-2">3. Staff Handles It</h5>
                <p className="fs-body-text mb-0 opacity-75">Issue is worked on.</p>
              </div>
            </Col>
            <Col xs={6} md={3}>
              <div className="glass-card p-3 h-100 glass-card-dark-text d-flex flex-column align-items-center justify-content-center">
                <FaCheckCircle size={24} className="mb-2" />
                <h5 className="fs-card-heading mb-2">4. Track Resolution</h5>
                <p className="fs-body-text mb-0 opacity-75">Monitor progress online.</p>
              </div>
            </Col>
          </Row>
        </div>
      </Container>
    </div>
  );
};

export default About;
