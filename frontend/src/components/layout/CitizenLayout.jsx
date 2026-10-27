import React, { useEffect, useState } from 'react';
import { Outlet, useNavigate } from 'react-router-dom';
import { Button, Offcanvas } from 'react-bootstrap';
import Sidebar from '../citizen/Sidebar';
import { FaLandmark, FaUserCircle, FaBars } from 'react-icons/fa';
import NotificationBell from '../common/NotificationBell';

import { api } from '../../services/api';

const CitizenLayout = () => {
  const navigate = useNavigate();
  const [userName, setUserName] = useState('');
  const [showMobileNav, setShowMobileNav] = useState(false);

  useEffect(() => {
    // Check initial local cache
    const userStr = localStorage.getItem('user');
    if (!userStr) {
      navigate('/citizen/login');
      return;
    }
    
    try {
      const user = JSON.parse(userStr);
      if (user.role !== 'CITIZEN') {
        navigate('/citizen/login');
        return;
      }
      const rawName = (user.full_name || user.fullName || user.name || user.first_name || user.username || '').trim();
      setUserName(rawName && rawName.toLowerCase() !== 'user' ? rawName : 'Citizen');
    } catch (e) {
      navigate('/citizen/login');
      return;
    }

    // Verify session validity with backend
    api.getProfile().then(profile => {
      if (!profile) {
        navigate('/citizen/login');
      } else if (profile.fullName) {
        setUserName(profile.fullName);
      }
    }).catch(() => {
      // Network hiccup - keep cached name
    });
  }, [navigate]);

  return (
    <div className="d-flex civic-dashboard-shell" style={{ minHeight: '100vh' }}>
      {/* Desktop Persistent Sidebar */}
      <div className="d-none d-md-block" style={{ zIndex: 100, width: '260px', flexShrink: 0 }}>
        <Sidebar />
      </div>

      {/* Mobile Offcanvas Drawer Sidebar */}
      <Offcanvas 
        show={showMobileNav} 
        onHide={() => setShowMobileNav(false)} 
        placement="start"
        className="mobile-sidebar-offcanvas civic-dashboard-offcanvas"
      >
        <Offcanvas.Header closeButton closeVariant="white">
          <Offcanvas.Title className="text-white d-flex align-items-center fs-6">
            <FaLandmark className="me-2 text-info" /> CivicConnect
          </Offcanvas.Title>
        </Offcanvas.Header>
        <Offcanvas.Body className="p-0">
          <Sidebar onNavigate={() => setShowMobileNav(false)} />
        </Offcanvas.Body>
      </Offcanvas>

      <div className="flex-grow-1 d-flex flex-column position-relative" style={{ overflowY: 'auto', overflowX: 'hidden', height: '100vh', minWidth: 0, zIndex: 2 }}>
        {/* Top Header */}
        <header className="civic-dashboard-header px-3 px-md-4 py-3 d-flex justify-content-between align-items-center">
          <div className="d-flex align-items-center text-truncate">
            {/* Hamburger Button for Mobile */}
            <Button 
              variant="link" 
              className="p-0 me-3 text-white d-md-none border-0 text-decoration-none d-flex align-items-center"
              onClick={() => setShowMobileNav(true)}
              aria-label="Open Navigation Menu"
            >
              <FaBars size={20} className="text-white" />
            </Button>
            <FaLandmark size={20} className="me-2 me-sm-3 flex-shrink-0 text-white" />
            <h5 className="mb-0 fw-bold d-none d-sm-inline text-truncate text-white" style={{ fontSize: '1.08rem' }}>
              Civic Issue Reporting and Management
            </h5>
            <h5 className="mb-0 fw-bold d-inline d-sm-none text-truncate text-white" style={{ fontSize: '1rem' }}>
              CivicConnect
            </h5>
          </div>
          <div className="d-flex align-items-center border-start border-white border-opacity-10 ps-3 ps-sm-4 ms-2 ms-sm-3 flex-shrink-0">
            <NotificationBell userRole="CITIZEN" />
            <FaUserCircle className="text-info me-2 me-sm-3 flex-shrink-0" size={30} />
            <div className="d-none d-sm-flex flex-column text-truncate" style={{ maxWidth: '140px' }}>
              <span className="fw-bold text-white lh-1 text-truncate small">{userName}</span>
              <span className="text-info lh-1 mt-1 text-truncate" style={{ fontSize: '0.72rem', letterSpacing: '0.5px' }}>CITIZEN PORTAL</span>
            </div>
          </div>
        </header>

        {/* Main Content Area */}
        <main className="flex-grow-1 p-3 p-md-4 p-xl-5 w-100 mx-auto" style={{ maxWidth: '1400px' }}>
          <Outlet />
        </main>
      </div>
    </div>
  );
};

export default CitizenLayout;
