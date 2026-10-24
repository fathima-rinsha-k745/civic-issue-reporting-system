import React from 'react';
import { Container, Row, Col } from 'react-bootstrap';
import { useNavigate } from 'react-router-dom';
import {
  FaEnvelope,
  FaRegEnvelope,
  FaMapMarkerAlt,
  FaClock,
  FaRegClock,
  FaQuestion,
  FaFileAlt,
  FaSearch,
  FaArrowRight
} from 'react-icons/fa';

const Contact = () => {
  const navigate = useNavigate();

  // Citizen Report flow
  const handleReportIssue = () => {
    const userStr = localStorage.getItem('user');
    if (userStr) {
      try {
        const user = JSON.parse(userStr);
        if (user.role === 'CITIZEN') {
          navigate('/dashboard/citizen/report');
          return;
        }
      } catch (err) {
        // Fallback to login
      }
    }
    navigate('/citizen/login', { state: { redirectTo: '/dashboard/citizen/report' } });
  };

  // Citizen Track flow
  const handleTrackIssue = () => {
    const userStr = localStorage.getItem('user');
    if (userStr) {
      try {
        const user = JSON.parse(userStr);
        if (user.role === 'CITIZEN') {
          navigate('/dashboard/citizen/complaints');
          return;
        }
      } catch (err) {
        // Fallback to login
      }
    }
    navigate('/citizen/login', { state: { redirectTo: '/dashboard/citizen/complaints' } });
  };

  return (
    <div className="civic-contact-viewport">
      {/* Dark Navy Background Gradient Overlay */}
      <div className="civic-contact-overlay" />

      {/* Main Content */}
      <Container className="civic-contact-content">
        {/* Top spacer for floating transparent header */}
        <div className="hero-top-spacer mb-4" />

        {/* Header: Eyebrow, Title & Subtitle */}
        <div className="civic-contact-header">
          <div className="d-flex align-items-center mb-2">
            <span className="hero-eyebrow-accent me-2" style={{ width: '28px' }} />
            <span className="hero-eyebrow-text">CONTACT US</span>
          </div>
          <h1 className="civic-contact-title">
            Get in <span className="civic-contact-title-accent">Touch</span>
          </h1>
          <p className="civic-contact-subtitle mb-0">
            Have a question or need more information about CivicConnect?<br />
            We're here to help.
          </p>
        </div>

        {/* Three Contact Cards Grid */}
        <Row className="g-4 mb-4">
          {/* Card 1: Email Support */}
          <Col lg={4} md={6}>
            <div className="civic-contact-card">
              <div>
                <div
                  className="civic-contact-icon-circle"
                  style={{
                    background: '#2563EB',
                    boxShadow: '0 4px 14px rgba(37, 99, 235, 0.45)'
                  }}
                >
                  <FaEnvelope size={20} className="text-white" />
                </div>
                <h3 className="civic-contact-card-title">Email Support</h3>
                <p className="civic-contact-card-desc">
                  For general inquiries, project information, or assistance.
                </p>
              </div>

              <div className="civic-contact-inner-pill">
                <FaRegEnvelope size={16} className="text-white-50 flex-shrink-0" />
                <a
                  href="mailto:support@civicconnect.gov.in"
                  className="text-white text-decoration-none text-truncate"
                >
                  support@civicconnect.gov.in
                </a>
              </div>
            </div>
          </Col>

          {/* Card 2: Municipal Office */}
          <Col lg={4} md={6}>
            <div className="civic-contact-card">
              <div>
                <div
                  className="civic-contact-icon-circle"
                  style={{
                    background: '#0D9488',
                    boxShadow: '0 4px 14px rgba(13, 148, 136, 0.45)'
                  }}
                >
                  <FaMapMarkerAlt size={20} className="text-white" />
                </div>
                <h3 className="civic-contact-card-title">Municipal Office</h3>
                <p className="civic-contact-card-desc">
                  Visit our municipal office for official correspondence.
                </p>
              </div>

              <div className="civic-contact-info-block">
                <FaMapMarkerAlt size={16} className="text-white-50 flex-shrink-0 mt-1" />
                <div>
                  <div className="fw-semibold text-white">CivicConnect Municipal Corporation</div>
                  <div>123 Municipal Building,</div>
                  <div>Kothamangalam, Ernakulam,</div>
                  <div>Kerala - 686XXX</div>
                </div>
              </div>
            </div>
          </Col>

          {/* Card 3: Support Hours */}
          <Col lg={4} md={12}>
            <div className="civic-contact-card">
              <div>
                <div
                  className="civic-contact-icon-circle"
                  style={{
                    background: '#F59E0B',
                    boxShadow: '0 4px 14px rgba(245, 158, 11, 0.45)'
                  }}
                >
                  <FaClock size={20} className="text-white" />
                </div>
                <h3 className="civic-contact-card-title">Support Hours</h3>
                <p className="civic-contact-card-desc">
                  We are available during the following hours:
                </p>
              </div>

              <div className="civic-contact-info-block">
                <FaRegClock size={16} className="text-white-50 flex-shrink-0 mt-1" />
                <div>
                  <div className="text-white">Monday - Friday</div>
                  <div className="text-white-50 mb-1">9:00 AM - 5:00 PM</div>
                  <div className="text-white">Saturday: 9:00 AM - 1:00 PM</div>
                  <div className="text-white-50" style={{ fontSize: '0.82rem' }}>
                    (Closed on Sundays and Public Holidays)
                  </div>
                </div>
              </div>
            </div>
          </Col>
        </Row>

        {/* Bottom Wide Action Banner: Need to Report a Civic Issue? */}
        <div className="civic-contact-banner d-flex align-items-center justify-content-between flex-wrap gap-3">
          <div className="d-flex align-items-center gap-3">
            <div
              className="civic-contact-icon-circle flex-shrink-0 mb-0"
              style={{
                width: '46px',
                height: '46px',
                background: '#2563EB',
                boxShadow: '0 4px 14px rgba(37, 99, 235, 0.45)'
              }}
            >
              <FaQuestion size={20} className="text-white" />
            </div>
            <div>
              <h4 className="text-white fw-bold mb-1" style={{ fontSize: '1.15rem' }}>
                Need to Report a Civic Issue?
              </h4>
              <p className="text-white-50 mb-0" style={{ fontSize: '0.88rem' }}>
                For issues related to waste, roads, street lights, water supply or other civic problems, please use the report feature.
              </p>
            </div>
          </div>

          <div className="d-flex align-items-center gap-3 flex-wrap">
            <button
              type="button"
              className="civic-btn-report"
              onClick={handleReportIssue}
              aria-label="Report an Issue"
            >
              <FaFileAlt size={14} />
              <span>Report an Issue</span>
              <FaArrowRight size={13} />
            </button>

            <button
              type="button"
              className="civic-btn-track"
              onClick={handleTrackIssue}
              aria-label="Track My Issue"
            >
              <div
                className="rounded-circle d-flex align-items-center justify-content-center"
                style={{ width: '22px', height: '22px', background: '#0284C7' }}
              >
                <FaSearch size={11} className="text-white" />
              </div>
              <span>Track My Issue</span>
              <FaArrowRight size={13} />
            </button>
          </div>
        </div>

      </Container>
    </div>
  );
};

export default Contact;
