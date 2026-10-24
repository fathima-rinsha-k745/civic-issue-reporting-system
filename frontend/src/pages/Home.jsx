import React from 'react';
import { Container, Row, Col } from 'react-bootstrap';
import { useNavigate } from 'react-router-dom';
import {
  FaFileAlt,
  FaArrowRight,
  FaSearch,
  FaLeaf,
  FaChartBar,
  FaUsers
} from 'react-icons/fa';

const Home = () => {
  const navigate = useNavigate();

  // 1. Primary Action: Report an Issue
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
        // Fallback to citizen login
      }
    }
    navigate('/citizen/login', { state: { redirectTo: '/dashboard/citizen/report' } });
  };

  // 2. Adjacent Secondary Action: Track My Issue
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
        // Fallback to citizen login
      }
    }
    navigate('/citizen/login', { state: { redirectTo: '/dashboard/citizen/complaints' } });
  };

  return (
    <div className="civic-hero-viewport position-relative">
      {/* Background Dark Navy Gradient Overlay */}
      <div className="civic-hero-overlay" />

      {/* Main Hero Container */}
      <Container className="civic-hero-content position-relative d-flex flex-column justify-content-between h-100">

        {/* Top Spacer for floating header */}
        <div className="hero-top-spacer" />

        {/* Center / Middle Content Area */}
        <div className="hero-middle-section my-auto py-2 py-lg-3">
          <Row className="align-items-center">
            <Col xl={8} lg={9} md={11} className="text-start">

              {/* Eyebrow Tag */}
              <div className="hero-eyebrow d-flex align-items-center mb-2 mb-lg-3">
                <span className="hero-eyebrow-accent me-3" />
                <span className="hero-eyebrow-text">
                  CLEANER CITIES &nbsp;|&nbsp; SAFER COMMUNITIES &nbsp;|&nbsp; BETTER TOMORROW
                </span>
              </div>

              {/* Main Heading */}
              <h1 className="hero-main-heading mb-2 mb-lg-3">
                Civic Issue Reporting<br />
                and Management<br />
                <span className="hero-heading-highlight">System</span>
              </h1>

              {/* Subtitle */}
              <p className="hero-subtitle mb-3 mb-lg-4">
                A smarter way to report civic problems, track resolutions, and connect with your
                local municipal authorities.
              </p>

              {/* Primary ("Report an Issue") and Adjacent Secondary ("Track My Issue") Action Cards */}
              <div className="hero-action-cards-row d-flex flex-column flex-sm-row align-items-stretch gap-3 mb-3 mb-lg-4">

                {/* Primary Action Card – Report an Issue */}
                <div
                  className="citizen-action-card primary-action-card d-flex align-items-center justify-content-between"
                  onClick={handleReportIssue}
                  role="button"
                  tabIndex={0}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' || e.key === ' ') {
                      e.preventDefault();
                      handleReportIssue();
                    }
                  }}
                  aria-label="Report an Issue - Report civic problems easily"
                >
                  <div className="d-flex align-items-center gap-3">
                    <div className="citizen-card-icon-circle d-flex align-items-center justify-content-center flex-shrink-0">
                      <FaFileAlt size={20} className="text-white" />
                    </div>
                    <div className="citizen-card-text">
                      <div className="citizen-card-title">Report an Issue</div>
                      <div className="citizen-card-subtitle">Report civic problems easily</div>
                    </div>
                  </div>
                  <div className="citizen-card-arrow-circle d-flex align-items-center justify-content-center flex-shrink-0 ms-2">
                    <FaArrowRight size={14} className="citizen-arrow-icon" />
                  </div>
                </div>

                {/* Adjacent Secondary Action Card – Track My Issue */}
                <div
                  className="citizen-action-card secondary-action-card d-flex align-items-center justify-content-between"
                  onClick={handleTrackIssue}
                  role="button"
                  tabIndex={0}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' || e.key === ' ') {
                      e.preventDefault();
                      handleTrackIssue();
                    }
                  }}
                  aria-label="Track My Issue - Check real-time progress"
                >
                  <div className="d-flex align-items-center gap-3">
                    <div className="citizen-card-icon-circle secondary-icon-circle d-flex align-items-center justify-content-center flex-shrink-0">
                      <FaSearch size={18} className="text-white" />
                    </div>
                    <div className="citizen-card-text">
                      <div className="citizen-card-title">Track My Issue</div>
                      <div className="citizen-card-subtitle">Check real-time status</div>
                    </div>
                  </div>
                  <div className="citizen-card-arrow-circle secondary-arrow-circle d-flex align-items-center justify-content-center flex-shrink-0 ms-2">
                    <FaArrowRight size={14} className="citizen-arrow-icon" />
                  </div>
                </div>

              </div>

              {/* Feature Highlights Row */}
              <div className="hero-feature-highlights d-flex align-items-center flex-wrap mb-2 mb-lg-3">
                {/* 1. Report */}
                <div className="feature-item d-flex align-items-center gap-2">
                  <div className="feature-icon-circle d-flex align-items-center justify-content-center">
                    <FaLeaf size={14} className="feature-icon" />
                  </div>
                  <div className="feature-text">
                    <div className="feature-title">Report</div>
                    <div className="feature-subtitle">Civic issues easily</div>
                  </div>
                </div>

                <div className="feature-divider d-none d-sm-block" />

                {/* 2. Track */}
                <div className="feature-item d-flex align-items-center gap-2">
                  <div className="feature-icon-circle d-flex align-items-center justify-content-center">
                    <FaChartBar size={14} className="feature-icon" />
                  </div>
                  <div className="feature-text">
                    <div className="feature-title">Track</div>
                    <div className="feature-subtitle">Real-time progress</div>
                  </div>
                </div>

                <div className="feature-divider d-none d-sm-block" />

                {/* 3. Connect */}
                <div className="feature-item d-flex align-items-center gap-2">
                  <div className="feature-icon-circle d-flex align-items-center justify-content-center">
                    <FaUsers size={14} className="feature-icon" />
                  </div>
                  <div className="feature-text">
                    <div className="feature-title">Connect</div>
                    <div className="feature-subtitle">With your municipality</div>
                  </div>
                </div>
              </div>

            </Col>
          </Row>
        </div>

        {/* Bottom Area: Closing Tagline (Authority/Staff cards moved to Navbar Login Dropdown) */}
        <div className="hero-bottom-bar pb-4 pb-lg-5">
          <div className="hero-closing-tagline d-flex align-items-center">
            <span className="closing-accent-bar me-3" />
            <span className="closing-text">
              Together for a Cleaner, Greener and Healthier City
            </span>
          </div>
        </div>

      </Container>
    </div>
  );
};

export default Home;

