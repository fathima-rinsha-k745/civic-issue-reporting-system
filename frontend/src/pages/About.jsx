import React from 'react';
import { Container, Row, Col } from 'react-bootstrap';
import { Link } from 'react-router-dom';
import {
  FaEye,
  FaBullseye,
  FaUsers,
  FaShieldAlt,
  FaLeaf,
  FaBolt,
  FaCheckCircle,
  FaSmile,
  FaClock,
  FaChartLine,
  FaMapMarkerAlt,
  FaLandmark,
  FaHardHat,
  FaCheckDouble,
  FaArrowRight
} from 'react-icons/fa';

const About = () => {
  const coreValues = [
    {
      title: 'Citizen First',
      desc: 'Prioritizing resident convenience, safety, and community well-being through accessible, hassle-free reporting tools.',
      icon: <FaUsers />,
      color: '#38BDF8',
      bg: 'rgba(56, 189, 248, 0.15)'
    },
    {
      title: 'Transparency',
      desc: 'Building trust with real-time tracking, transparent workflows, and open communication at every stage of resolution.',
      icon: <FaShieldAlt />,
      color: '#2DD4BF',
      bg: 'rgba(45, 212, 191, 0.15)'
    },
    {
      title: 'Sustainability',
      desc: 'Fostering clean, green, and resilient urban habitats by swiftly resolving waste, drainage, and ecological hazards.',
      icon: <FaLeaf />,
      color: '#4ADE80',
      bg: 'rgba(74, 222, 128, 0.15)'
    },
    {
      title: 'Efficiency',
      desc: 'Eliminating administrative bottlenecks through automated department routing and proactive field coordination.',
      icon: <FaBolt />,
      color: '#FBBF24',
      bg: 'rgba(251, 191, 36, 0.15)'
    }
  ];

  const stats = [
    {
      number: '15,000+',
      label: 'Issues Resolved',
      sublabel: 'Across civic departments',
      icon: <FaCheckCircle className="text-info" />
    },
    {
      number: '98%',
      label: 'Citizen Satisfaction',
      sublabel: 'Verified feedback score',
      icon: <FaSmile className="text-warning" />
    },
    {
      number: '< 48 hrs',
      label: 'Average Response',
      sublabel: 'Rapid field deployment',
      icon: <FaClock className="text-primary" />
    },
    {
      number: '100%',
      label: 'Transparency',
      sublabel: 'End-to-end digital tracking',
      icon: <FaChartLine className="text-success" />
    }
  ];

  const steps = [
    {
      step: '01',
      title: 'Report Issue',
      desc: 'Pin GPS location, capture photos, and describe the civic problem easily.',
      icon: <FaMapMarkerAlt />
    },
    {
      step: '02',
      title: 'Authority Review',
      desc: 'Municipal authority reviews, categorizes, and assigns to the right department.',
      icon: <FaLandmark />
    },
    {
      step: '03',
      title: 'Field Resolution',
      desc: 'Department staff inspects the site, performs repair work, and submits remarks.',
      icon: <FaHardHat />
    },
    {
      step: '04',
      title: 'Verified Closure',
      desc: 'Resolution is recorded, status is updated, and the citizen receives confirmation.',
      icon: <FaCheckDouble />
    }
  ];

  return (
    <div className="civic-subpage-viewport">
      {/* Background Gradient Overlay */}
      <div className="civic-subpage-overlay" />

      {/* Main Subpage Content */}
      <Container className="civic-subpage-content">
        {/* Spacer for floating navbar */}
        <div className="civic-subpage-spacer" />

        {/* Page Header */}
        <div className="civic-subpage-header">
          <div className="d-inline-flex align-items-center mb-2">
            <span className="hero-eyebrow-accent me-2" />
            <span className="hero-eyebrow-text">
              ABOUT CIVICCONNECT &nbsp;|&nbsp; EMPOWERING COMMUNITIES
            </span>
          </div>
          <h1 className="civic-subpage-title mb-3">
            Building Smarter, Cleaner & <br />
            <span className="hero-heading-highlight">Responsive Cities</span>
          </h1>
          <p className="civic-subpage-lead mx-auto">
            CivicConnect is a unified civic technology platform designed to bridge the gap between citizens,
            municipal authorities, and department staff. We enable transparent issue reporting, accountable
            governance, and rapid community-wide resolutions.
          </p>
        </div>

        {/* Vision & Mission Cards */}
        <Row className="g-4 mb-5">
          {/* Vision */}
          <Col md={6}>
            <div className="civic-glass-card civic-focus-card">
              <div
                className="civic-focus-icon-circle"
                style={{ background: 'linear-gradient(135deg, #2563EB 0%, #1D4ED8 100%)' }}
              >
                <FaEye size={24} className="text-white" />
              </div>
              <div className="civic-section-label">Future Outlook</div>
              <h2 className="civic-focus-title">Our Vision</h2>
              <p className="civic-focus-text">
                To create digitally empowered, sustainable, and inclusive urban centers where civic issues
                are reported seamlessly and addressed swiftly. We envision cities where every resident acts
                as an active custodian of their neighborhood, supported by transparent and agile local governments.
              </p>
            </div>
          </Col>

          {/* Mission */}
          <Col md={6}>
            <div className="civic-glass-card civic-focus-card">
              <div
                className="civic-focus-icon-circle"
                style={{ background: 'linear-gradient(135deg, #0D9488 0%, #0F766E 100%)' }}
              >
                <FaBullseye size={24} className="text-white" />
              </div>
              <div className="civic-section-label">Core Purpose</div>
              <h2 className="civic-focus-title">Our Mission</h2>
              <p className="civic-focus-text">
                To simplify civic engagement through accessible web tools, eliminate operational barriers
                in municipal workflows, and provide actionable real-time insights to public administrators
                for data-driven urban maintenance and heightened accountability.
              </p>
            </div>
          </Col>
        </Row>

        {/* Core Values Section */}
        <div className="mb-5">
          <div className="text-center mb-4">
            <div className="civic-section-label justify-content-center">Guiding Principles</div>
            <h2 className="civic-section-title">Our Core Values</h2>
            <p className="text-white-50 mx-auto" style={{ maxWidth: '620px', fontSize: '0.92rem' }}>
              The foundational pillars that guide how we engineer technology and facilitate public sector excellence.
            </p>
          </div>

          <Row className="g-4">
            {coreValues.map((val, idx) => (
              <Col lg={3} sm={6} key={idx}>
                <div className="civic-glass-card civic-value-card">
                  <div
                    className="civic-value-icon"
                    style={{ background: val.bg, color: val.color }}
                  >
                    {val.icon}
                  </div>
                  <h3 className="civic-value-title">{val.title}</h3>
                  <p className="civic-value-desc">{val.desc}</p>
                </div>
              </Col>
            ))}
          </Row>
        </div>

        {/* Impact Statistics Section */}
        <div className="mb-5">
          <div className="text-center mb-4">
            <div className="civic-section-label justify-content-center">Proven Impact</div>
            <h2 className="civic-section-title">Transforming Urban Governance</h2>
          </div>

          <Row className="g-4">
            {stats.map((stat, idx) => (
              <Col lg={3} sm={6} key={idx}>
                <div className="civic-stat-box">
                  <div className="civic-stat-number">{stat.number}</div>
                  <div className="civic-stat-label">{stat.label}</div>
                  <div className="civic-stat-sublabel">{stat.sublabel}</div>
                </div>
              </Col>
            ))}
          </Row>
        </div>

        {/* How CivicConnect Works */}
        <div className="mb-4">
          <div className="text-center mb-4">
            <div className="civic-section-label justify-content-center">Workflow</div>
            <h2 className="civic-section-title">How CivicConnect Works</h2>
          </div>

          <Row className="g-4">
            {steps.map((item, idx) => (
              <Col lg={3} sm={6} key={idx}>
                <div className="civic-glass-card p-4 h-100 d-flex flex-column justify-content-between">
                  <div>
                    <div className="d-flex align-items-center justify-content-between mb-3">
                      <span className="text-info fw-bold" style={{ letterSpacing: '1px' }}>
                        {item.step}
                      </span>
                      <div
                        className="rounded-circle d-flex align-items-center justify-content-center text-white"
                        style={{ width: '38px', height: '38px', background: 'rgba(37, 99, 235, 0.35)' }}
                      >
                        {item.icon}
                      </div>
                    </div>
                    <h4 className="civic-value-title mb-2">{item.title}</h4>
                    <p className="civic-value-desc">{item.desc}</p>
                  </div>
                </div>
              </Col>
            ))}
          </Row>
        </div>

        {/* Call to Action Banner */}
        <div className="mt-5 pt-2">
          <div
            className="civic-glass-card p-4 p-md-5 text-center position-relative overflow-hidden"
            style={{ borderColor: 'rgba(59, 130, 246, 0.4)' }}
          >
            <h3 className="text-white fw-bold mb-2" style={{ fontSize: '1.65rem' }}>
              Ready to Make Your Neighborhood Better?
            </h3>
            <p className="text-white-50 mx-auto mb-4" style={{ maxWidth: '560px' }}>
              Report a civic issue in less than two minutes and track its progress in real time.
            </p>
            <div className="d-flex justify-content-center gap-3 flex-wrap">
              <Link
                to="/citizen/login"
                state={{ redirectTo: '/dashboard/citizen/report' }}
                className="btn btn-primary px-4 py-2 rounded-pill fw-semibold d-inline-flex align-items-center gap-2"
                style={{ background: 'var(--civic-royal)', border: 'none' }}
              >
                <span>Report an Issue</span>
                <FaArrowRight size={13} />
              </Link>
              <Link
                to="/services"
                className="btn btn-outline-light px-4 py-2 rounded-pill fw-semibold"
                style={{ borderColor: 'rgba(255, 255, 255, 0.35)' }}
              >
                Explore Services
              </Link>
            </div>
          </div>
        </div>

      </Container>
    </div>
  );
};

export default About;
