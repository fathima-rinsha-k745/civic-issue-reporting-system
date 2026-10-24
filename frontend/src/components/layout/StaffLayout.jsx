import React, { useEffect, useState } from 'react';
import { Outlet, useNavigate } from 'react-router-dom';
import { Button, Offcanvas } from 'react-bootstrap';
import Sidebar from '../staff/Sidebar';
import { FaHardHat, FaUserCircle, FaBars } from 'react-icons/fa';
import { api } from '../../services/api';
import NotificationBell from '../common/NotificationBell';

const StaffLayout = () => {
  const navigate = useNavigate();
  const [showMobileNav, setShowMobileNav] = useState(false);
  const [userName, setUserName] = useState(() => {
    try {
      const u = JSON.parse(localStorage.getItem('user') || '{}');
      return u.full_name || 'Staff Member';
    } catch (e) {
      return 'Staff Member';
    }
  });
  const [userDepartment, setUserDepartment] = useState(() => {
    try {
      const u = JSON.parse(localStorage.getItem('user') || '{}');
      return u.department || 'Department Staff';
    } catch (e) {
      return 'Department Staff';
    }
  });

  useEffect(() => {
    // Check authentication
    const userStr = localStorage.getItem('user');
    if (!userStr) {
      navigate('/staff/login');
      return;
    }
    
    try {
      const user = JSON.parse(userStr);
      if (user.role !== 'DEPARTMENT_STAFF') {
        navigate('/staff/login');
        return;
      }
      if (user.full_name) setUserName(user.full_name);
      if (user.department) setUserDepartment(user.department);
    } catch (e) {
      navigate('/staff/login');
      return;
    }

    // Refresh profile from server to guarantee sync across refresh
    api.getProfile().then(profile => {
      if (profile && profile.fullName) {
        setUserName(profile.fullName);
        if (profile.department) {
          setUserDepartment(profile.department);
        }
      }
    }).catch(err => {
      console.warn("Could not refresh staff profile in layout:", err);
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
            <FaHardHat className="me-2 text-warning" /> CivicConnect
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
            <FaHardHat size={20} className="me-2 me-sm-3 flex-shrink-0 text-warning" />
            <h5 className="mb-0 fw-bold d-none d-sm-inline text-truncate text-white" style={{ fontSize: '1.08rem' }}>
              Civic Issue Reporting and Management
            </h5>
            <h5 className="mb-0 fw-bold d-inline d-sm-none text-truncate text-white" style={{ fontSize: '1rem' }}>
              Department Staff
            </h5>
          </div>
          <div className="d-flex align-items-center border-start border-white border-opacity-10 ps-3 ps-sm-4 ms-2 ms-sm-3 flex-shrink-0">
            <NotificationBell userRole="DEPARTMENT_STAFF" />
            <FaUserCircle className="text-warning me-2 me-sm-3 flex-shrink-0" size={30} />
            <div className="d-none d-sm-flex flex-column text-truncate" style={{ maxWidth: '140px' }}>
              <span className="fw-bold text-white lh-1 text-truncate small">{userName}</span>
              <span className="text-warning lh-1 mt-1 text-truncate" style={{ fontSize: '0.72rem', letterSpacing: '0.5px' }}>{userDepartment}</span>
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

export default StaffLayout;
