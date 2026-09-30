import React from 'react';
import { Nav } from 'react-bootstrap';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { FaTachometerAlt, FaPlusCircle, FaListUl, FaUser, FaSignOutAlt, FaLandmark } from 'react-icons/fa';

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
  const isComplaintsActive = currentPath.includes('/dashboard/citizen/complaints');

  return (
    <div className="d-flex flex-column" style={{ minHeight: '100vh', width: '260px', backgroundColor: '#0B1B3D' }}>
      <div className="p-4 border-bottom" style={{ borderColor: 'rgba(255,255,255,0.1)' }}>
        <h5 className="mb-0 text-white d-flex align-items-center">
          <FaLandmark className="me-2" /> Civic Portal
        </h5>
        <small className="text-light opacity-75">Citizen Dashboard</small>
      </div>

      <Nav className="flex-column mt-4 px-3">
        <Nav.Link 
          as={Link} 
          to="/dashboard/citizen" 
          className={`px-4 py-3 mb-2 rounded d-flex align-items-center ${isActive('/dashboard/citizen') ? 'bg-primary fw-bold' : ''}`}
          style={{ color: '#FFFFFF' }}
        >
          <FaTachometerAlt className="me-3 fs-5" style={{ color: '#FFFFFF' }} /> 
          <span style={{ color: '#FFFFFF' }}>Dashboard</span>
        </Nav.Link>
        
        <Nav.Link 
          as={Link} 
          to="/dashboard/citizen/report" 
          className={`px-4 py-3 mb-2 rounded d-flex align-items-center ${isActive('/dashboard/citizen/report') ? 'bg-primary fw-bold' : ''}`}
          style={{ color: '#FFFFFF' }}
        >
          <FaPlusCircle className="me-3 fs-5" style={{ color: '#FFFFFF' }} /> 
          <span style={{ color: '#FFFFFF' }}>Report an Issue</span>
        </Nav.Link>
        
        <Nav.Link 
          as={Link} 
          to="/dashboard/citizen/complaints" 
          className={`px-4 py-3 mb-2 rounded d-flex align-items-center ${isComplaintsActive ? 'bg-primary fw-bold' : ''}`}
          style={{ color: '#FFFFFF' }}
        >
          <FaListUl className="me-3 fs-5" style={{ color: '#FFFFFF' }} /> 
          <span style={{ color: '#FFFFFF' }}>My Complaints</span>
        </Nav.Link>
        
        <Nav.Link 
          as={Link} 
          to="/dashboard/citizen/profile" 
          className={`px-4 py-3 mb-2 rounded d-flex align-items-center ${currentPath.includes('/dashboard/citizen/profile') ? 'bg-primary fw-bold' : ''}`}
          style={{ color: '#FFFFFF' }}
        >
          <FaUser className="me-3 fs-5" style={{ color: '#FFFFFF' }} /> 
          <span style={{ color: '#FFFFFF' }}>Profile</span>
        </Nav.Link>
        
        <Nav.Link 
          onClick={handleLogout}
          className="px-4 py-3 mb-2 rounded d-flex align-items-center"
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
