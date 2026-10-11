import React from 'react';
import { Container, Row, Col, Card } from 'react-bootstrap';
import { FaLaptop, FaChartLine, FaClipboardCheck, FaSitemap, FaWrench, FaTasks } from 'react-icons/fa';

const Services = () => {
  const services = [
    {
      title: 'Report Civic Issues',
      description: 'Citizens can submit a complaint with a description, location, and supporting photograph.',
      icon: <FaLaptop />
    },
    {
      title: 'Track Complaints',
      description: 'Citizens can view their submitted complaints and check their current status.',
      icon: <FaChartLine />
    },
    {
      title: 'Assign Departments',
      description: 'Municipal authorities review complaints and assign them to the appropriate department.',
      icon: <FaClipboardCheck />
    },
    {
      title: 'Manage Complaints',
      description: 'Authorities can view, search, and filter complaints and monitor their progress.',
      icon: <FaTasks />
    },
    {
      title: 'Update Complaint Status',
      description: 'Department staff can update statuses (Pending, In Progress, Resolved) with remarks.',
      icon: <FaWrench />
    },
    {
      title: 'Manage Departments & Staff',
      description: 'Municipal authorities can easily manage internal departments and staff assignments.',
      icon: <FaSitemap />
    }
  ];

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
          <h1 className="fs-main-heading text-white text-shadow-sm mb-3">Our Services</h1>
          <p className="fs-body-text text-light mx-auto" style={{ maxWidth: '800px', opacity: 0.9 }}>
            Explore the core features of the CivicConnect platform designed for citizens, authorities, and staff.
          </p>
        </div>

        <Row className="g-4">
          {services.map((service, index) => (
            <Col md={6} lg={4} key={index}>
              <Card className="h-100 border-0 glass-card glass-card-dark-text text-center p-3">
                <Card.Body className="d-flex flex-column align-items-center">
                  <div className="mb-3" style={{ fontSize: '2rem', opacity: 0.9 }}>
                    {service.icon}
                  </div>
                  <h4 className="fs-card-heading mb-3">{service.title}</h4>
                  <p className="fs-body-text mb-0 opacity-75">{service.description}</p>
                </Card.Body>
              </Card>
            </Col>
          ))}
        </Row>
      </Container>
    </div>
  );
};

export default Services;
