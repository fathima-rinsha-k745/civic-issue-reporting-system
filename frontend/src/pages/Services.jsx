import React from 'react';
import { Container, Row, Col } from 'react-bootstrap';
import { useNavigate } from 'react-router-dom';
import {
  FaFileAlt,
  FaSearch,
  FaLandmark,
  FaHardHat,
  FaArrowRight,
  FaTrashAlt,
  FaRoad,
  FaLightbulb,
  FaTint,
  FaWater,
  FaTree,
  FaHeartbeat,
  FaExclamationTriangle
} from 'react-icons/fa';

const Services = () => {
  const navigate = useNavigate();

  // Navigation handlers for citizens matching Home.jsx auth flow
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

  // 4 Core Stakeholder Portals / Cards
  const stakeholderServices = [
    {
      title: 'Report an Issue',
      badge: 'Citizen Portal',
      badgeBg: 'rgba(37, 99, 235, 0.25)',
      badgeColor: '#60A5FA',
      desc: 'Easily lodge complaints regarding local infrastructure, attach photographs, and pin exact GPS coordinates for swift municipal action.',
      icon: <FaFileAlt size={22} className="text-white" />,
      iconBg: 'var(--civic-royal)',
      actionText: 'Report Issue Now',
      onClick: handleReportIssue
    },
    {
      title: 'Track My Issue',
      badge: 'Citizen Tracking',
      badgeBg: 'rgba(2, 132, 199, 0.25)',
      badgeColor: '#38BDF8',
      desc: 'Follow your reported issues with transparent, real-time stage updates, assigned department details, and verified resolution logs.',
      icon: <FaSearch size={20} className="text-white" />,
      iconBg: '#0284C7',
      actionText: 'Check Issue Status',
      onClick: handleTrackIssue
    },
    {
      title: 'Municipal Authority',
      badge: 'Administrative Control',
      badgeBg: 'rgba(13, 148, 136, 0.25)',
      badgeColor: '#2DD4BF',
      desc: 'Review incoming citizen reports, prioritize critical tasks, delegate work orders to relevant departments, and inspect civic analytics.',
      icon: <FaLandmark size={20} className="text-white" />,
      iconBg: 'var(--civic-teal)',
      actionText: 'Authority Portal',
      onClick: () => navigate('/authority/login')
    },
    {
      title: 'Department Staff',
      badge: 'Field Operations',
      badgeBg: 'rgba(217, 119, 6, 0.25)',
      badgeColor: '#FBBF24',
      desc: 'Access prioritized field assignments, conduct on-site inspections, post resolution remarks, upload proof photos, and close tickets.',
      icon: <FaHardHat size={20} className="text-white" />,
      iconBg: 'var(--civic-amber)',
      actionText: 'Staff Login',
      onClick: () => navigate('/staff/login')
    }
  ];

  // Civic Issue Categories Handled
  const categories = [
    {
      title: 'Waste Management',
      desc: 'Overflowing bins, uncollected residential waste, illegal street dumping, and litter clearance.',
      icon: <FaTrashAlt />,
      color: '#34D399',
      bg: 'rgba(52, 211, 153, 0.15)'
    },
    {
      title: 'Roads & Pavements',
      desc: 'Potholes, damaged pedestrian pavements, road subsidence, broken curbs, and missing signs.',
      icon: <FaRoad />,
      color: '#FB923C',
      bg: 'rgba(251, 146, 60, 0.15)'
    },
    {
      title: 'Street Lights',
      desc: 'Non-functional streetlights, intermittent flickering, exposed electrical wires, and dark road hazards.',
      icon: <FaLightbulb />,
      color: '#FBBF24',
      bg: 'rgba(251, 191, 36, 0.15)'
    },
    {
      title: 'Water Supply',
      desc: 'Pipeline bursts, water leakage, contaminated drinking water, low pressure, and pipeline repairs.',
      icon: <FaTint />,
      color: '#38BDF8',
      bg: 'rgba(56, 189, 248, 0.15)'
    },
    {
      title: 'Drainage & Sewage',
      desc: 'Blocked storm drains, open manholes, wastewater backups, and monsoon waterlogging hazards.',
      icon: <FaWater />,
      color: '#22D3EE',
      bg: 'rgba(34, 211, 238, 0.15)'
    },
    {
      title: 'Parks & Green Spaces',
      desc: 'Overgrown park vegetation, damaged recreational benches, broken playground equipment, and fallen trees.',
      icon: <FaTree />,
      color: '#4ADE80',
      bg: 'rgba(74, 222, 128, 0.15)'
    },
    {
      title: 'Public Health & Sanitation',
      desc: 'Stagnant water breeding mosquitoes, public restroom sanitation, hygiene hazards, and pest control.',
      icon: <FaHeartbeat />,
      color: '#F43F5E',
      bg: 'rgba(244, 63, 94, 0.15)'
    },
    {
      title: 'Traffic & Public Safety',
      desc: 'Obstructed pedestrian walkways, malfunctioning traffic signals, hazardous debris, and safety concerns.',
      icon: <FaExclamationTriangle />,
      color: '#A78BFA',
      bg: 'rgba(167, 139, 250, 0.15)'
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
              OUR SERVICES &nbsp;|&nbsp; CIVIC MANAGEMENT PLATFORM
            </span>
          </div>
          <h1 className="civic-subpage-title mb-3">
            Comprehensive Civic Solutions for <br />
            <span className="hero-heading-highlight">Every Stakeholder</span>
          </h1>
          <p className="civic-subpage-lead mx-auto">
            Empowering residents with fast problem reporting and equipping civic authorities 
            with real-time operational management tools for an efficient, cleaner city.
          </p>
        </div>

        {/* Section 1: 4 Core Stakeholder Cards */}
        <div className="mb-5">
          <div className="text-center mb-4">
            <div className="civic-section-label justify-content-center">Platform Portals</div>
            <h2 className="civic-section-title">Core Services & Portals</h2>
            <p className="text-white-50 mx-auto" style={{ maxWidth: '600px', fontSize: '0.92rem' }}>
              Tailored workflows for citizens, municipal administrators, and frontline department personnel.
            </p>
          </div>

          <Row className="g-4">
            {stakeholderServices.map((service, idx) => (
              <Col lg={3} sm={6} key={idx}>
                <div
                  className="civic-stakeholder-card"
                  onClick={service.onClick}
                  role="button"
                  tabIndex={0}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' || e.key === ' ') {
                      e.preventDefault();
                      service.onClick();
                    }
                  }}
                  aria-label={`${service.title} - ${service.badge}`}
                >
                  <div>
                    {/* Top Icon & Badge */}
                    <div className="d-flex align-items-center justify-content-between mb-3">
                      <div
                        className="d-flex align-items-center justify-content-center rounded-circle flex-shrink-0"
                        style={{ width: '46px', height: '46px', background: service.iconBg }}
                      >
                        {service.icon}
                      </div>
                      <span
                        className="civic-badge-pill"
                        style={{ background: service.badgeBg, color: service.badgeColor }}
                      >
                        {service.badge}
                      </span>
                    </div>

                    <h3 className="civic-stakeholder-title">{service.title}</h3>
                    <p className="civic-stakeholder-desc">{service.desc}</p>
                  </div>

                  <div className="civic-stakeholder-action pt-2 border-top border-white border-opacity-10">
                    <span>{service.actionText}</span>
                    <FaArrowRight size={13} />
                  </div>
                </div>
              </Col>
            ))}
          </Row>
        </div>

        {/* Section 2: Civic Issue Categories Handled */}
        <div className="mb-5">
          <div className="text-center mb-4">
            <div className="civic-section-label justify-content-center">Domain Coverage</div>
            <h2 className="civic-section-title">Civic Issue Categories Handled</h2>
            <p className="text-white-50 mx-auto" style={{ maxWidth: '680px', fontSize: '0.92rem' }}>
              We route public complaints to specialized municipal departments for fast and accountable resolution.
            </p>
          </div>

          <Row className="g-4">
            {categories.map((cat, idx) => (
              <Col lg={3} md={4} sm={6} key={idx}>
                <div className="civic-category-card">
                  <div>
                    <div
                      className="civic-category-icon-box"
                      style={{ background: cat.bg, color: cat.color }}
                    >
                      {cat.icon}
                    </div>
                    <h3 className="civic-category-title">{cat.title}</h3>
                    <p className="civic-category-desc">{cat.desc}</p>
                  </div>

                  <button
                    type="button"
                    className="civic-category-link"
                    onClick={handleReportIssue}
                    aria-label={`Report issue in ${cat.title}`}
                  >
                    <span>Report this issue</span>
                    <FaArrowRight size={11} />
                  </button>
                </div>
              </Col>
            ))}
          </Row>
        </div>

        {/* Bottom Banner */}
        <div className="mt-5 pt-2">
          <div
            className="civic-glass-card p-4 p-md-5 text-center position-relative overflow-hidden"
            style={{ borderColor: 'rgba(59, 130, 246, 0.4)' }}
          >
            <h3 className="text-white fw-bold mb-2" style={{ fontSize: '1.65rem' }}>
              Notice a Municipal Problem in Your Area?
            </h3>
            <p className="text-white-50 mx-auto mb-4" style={{ maxWidth: '580px' }}>
              Submit a complaint with photos and location, and help your municipal authorities 
              take prompt corrective action.
            </p>
            <div className="d-flex justify-content-center gap-3 flex-wrap">
              <button
                type="button"
                onClick={handleReportIssue}
                className="btn btn-primary px-4 py-2 rounded-pill fw-semibold d-inline-flex align-items-center gap-2 border-0"
                style={{ background: 'var(--civic-royal)' }}
              >
                <span>Report an Issue</span>
                <FaArrowRight size={13} />
              </button>
              <button
                type="button"
                onClick={handleTrackIssue}
                className="btn btn-outline-light px-4 py-2 rounded-pill fw-semibold"
                style={{ borderColor: 'rgba(255, 255, 255, 0.35)' }}
              >
                Track Existing Issue
              </button>
            </div>
          </div>
        </div>

      </Container>
    </div>
  );
};

export default Services;
