import React from 'react';
import { Nav } from 'react-bootstrap';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { FaTachometerAlt, FaPlusCircle, FaListUl, FaUser, FaSignOutAlt, FaLandmark } from 'react-icons/fa';

const Sidebar = ({ onNavigate }) => {
  const location = useLocation();
  const navigate = useNavigate();
  const currentPath = location.pathname;

  const handleLinkClick = () => {
    if (onNavigate) onNavigate();
  };

  const handleLogout = async (e) => {
    e.preventDefault();
    if (onNavigate) onNavigate();
    try {
      await fetch('/api/logout/', { method: 'POST' });
    } catch (e) {}
    localStorage.removeItem('user');
    navigate('/');
  };

  const isActive = (path) => currentPath === path;
  const isComplaintsActive = currentPath.includes('/dashboard/citizen/complaints');
  const isProfileActive = currentPath.includes('/dashboard/citizen/profile');

  return (
    <div className="d-flex flex-column h-100 civic-dashboard-sidebar">
      {/* Brand Header */}
      <div className="p-4 border-bottom border-white border-opacity-10">
        <div className="d-flex align-items-center mb-1">
          <div className="civic-brand-icon-box me-2 d-flex align-items-center justify-content-center">
            <FaLandmark size={18} className="text-white" />
          </div>
          <span className="civic-brand-text fs-5">
            Civic<span className="civic-brand-accent">Connect</span>
          </span>
        </div>
        <span 
          className="badge rounded-pill" 
          style={{ 
            background: 'rgba(37, 99, 235, 0.25)', 
            color: '#60A5FA', 
            border: '1px solid rgba(37, 99, 235, 0.4)', 
            fontSize: '0.72rem',
            letterSpacing: '0.5px' 
          }}
        >
          CITIZEN PORTAL
        </span>
      </div>

      {/* Nav Menu */}
      <Nav className="flex-column mt-3 px-3 flex-grow-1">
        <Nav.Link 
          as={Link} 
          to="/dashboard/citizen" 
          onClick={handleLinkClick}
          className={`civic-sidebar-link ${isActive('/dashboard/citizen') ? 'active' : ''}`}
        >
          <FaTachometerAlt className="me-3 fs-5" /> 
          <span>Dashboard</span>
        </Nav.Link>
        
        <Nav.Link 
          as={Link} 
          to="/dashboard/citizen/report" 
          onClick={handleLinkClick}
          className={`civic-sidebar-link ${isActive('/dashboard/citizen/report') ? 'active' : ''}`}
        >
          <FaPlusCircle className="me-3 fs-5" /> 
          <span>Report an Issue</span>
        </Nav.Link>
        
        <Nav.Link 
          as={Link} 
          to="/dashboard/citizen/complaints" 
          onClick={handleLinkClick}
          className={`civic-sidebar-link ${isComplaintsActive ? 'active' : ''}`}
        >
          <FaListUl className="me-3 fs-5" /> 
          <span>My Complaints</span>
        </Nav.Link>
        
        <Nav.Link 
          as={Link} 
          to="/dashboard/citizen/profile" 
          onClick={handleLinkClick}
          className={`civic-sidebar-link ${isProfileActive ? 'active' : ''}`}
        >
          <FaUser className="me-3 fs-5" /> 
          <span>Profile</span>
        </Nav.Link>
        
        <Nav.Link 
          onClick={handleLogout}
          className="civic-sidebar-logout"
        >
          <FaSignOutAlt className="me-3 fs-5" /> 
          <span>Logout</span>
        </Nav.Link>
      </Nav>
    </div>
  );
};

export default Sidebar;
