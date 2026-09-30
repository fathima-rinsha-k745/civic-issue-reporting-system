import React from 'react';
import { Nav } from 'react-bootstrap';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { FaTachometerAlt, FaSignOutAlt, FaHardHat } from 'react-icons/fa';

const Sidebar = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const currentPath = location.pathname;

  const handleLogout = async (e) => {
    e.preventDefault();
    try {
      await fetch('/api/logout/', { method: 'POST' });
    } catch (e) {}
    localStorage.removeItem('user');
    navigate('/');
  };

  const isActive = (path) => currentPath === path;
  const isDashboardActive = currentPath === '/dashboard/department_staff' || currentPath.includes('/dashboard/department_staff/complaints');

  return (
    <div className="d-flex flex-column" style={{ minHeight: '100vh', width: '260px', backgroundColor: '#0B1B3D' }}>
      <div className="p-4 border-bottom" style={{ borderColor: 'rgba(255,255,255,0.1)' }}>
        <h5 className="mb-0 text-white d-flex align-items-center">
          <FaHardHat className="me-2" /> Staff Portal
        </h5>
        <small className="text-light opacity-75">Department Tasks</small>
      </div>

      <Nav className="flex-column mt-4 px-3">
        <Nav.Link 
          as={Link} 
          to="/dashboard/department_staff" 
          className={`px-4 py-3 mb-2 rounded d-flex align-items-center ${isDashboardActive ? 'bg-primary fw-bold' : ''}`}
          style={{ color: '#FFFFFF' }}
        >
          <FaTachometerAlt className="me-3 fs-5" style={{ color: '#FFFFFF' }} /> 
          <span style={{ color: '#FFFFFF' }}>Assigned Complaints</span>
        </Nav.Link>
        
        <Nav.Link 
          onClick={handleLogout} 
          className="px-4 py-3 mb-2 rounded d-flex align-items-center mt-auto" 
          style={{ cursor: 'pointer', color: '#FFFFFF' }}
        >
          <FaSignOutAlt className="me-3 fs-5" style={{ color: '#FFFFFF' }} /> 
          <span style={{ color: '#FFFFFF' }}>Logout</span>
        </Nav.Link>
      </Nav>
    </div>
  );
};

export default Sidebar;
