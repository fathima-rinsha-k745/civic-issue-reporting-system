import React, { useState, useEffect } from 'react';
import { Nav } from 'react-bootstrap';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { FaTachometerAlt, FaList, FaUser, FaSignOutAlt, FaHardHat, FaUserCircle } from 'react-icons/fa';
import { api } from '../../services/api';

const Sidebar = ({ onNavigate }) => {
  const location = useLocation();
  const navigate = useNavigate();
  const currentPath = location.pathname;
  const [userInfo, setUserInfo] = useState(() => {
    try {
      const u = JSON.parse(localStorage.getItem('user') || '{}');
      return {
        name: u.full_name || 'Staff Member',
        department: u.department || 'Department Staff'
      };
    } catch (e) {
      return { name: 'Staff Member', department: 'Department Staff' };
    }
  });

  useEffect(() => {
    api.getProfile().then(profile => {
      if (profile && profile.fullName) {
        setUserInfo({
          name: profile.fullName,
          department: profile.department || 'Department Staff'
        });
      }
    }).catch(() => {});
  }, []);

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

  const isActive = (path) => currentPath === path || (path !== '/dashboard/department_staff' && currentPath.startsWith(path));

  return (
    <div className="d-flex flex-column h-100 civic-dashboard-sidebar">
      {/* Brand Header */}
      <div className="p-4 border-bottom border-white border-opacity-10">
        <div className="d-flex align-items-center mb-1">
          <div className="civic-brand-icon-box me-2 d-flex align-items-center justify-content-center">
            <FaHardHat size={18} className="text-warning" />
          </div>
          <span className="civic-brand-text fs-5">
            Civic<span className="civic-brand-accent">Connect</span>
          </span>
        </div>
        <span 
          className="badge rounded-pill" 
          style={{ 
            background: 'rgba(217, 119, 6, 0.25)', 
            color: '#FBBF24', 
            border: '1px solid rgba(217, 119, 6, 0.4)', 
            fontSize: '0.72rem',
            letterSpacing: '0.5px' 
          }}
        >
          FIELD STAFF PORTAL
        </span>
      </div>

      {/* Staff profile summary badge */}
      <div className="px-4 py-3 border-bottom border-white border-opacity-10" style={{ background: 'rgba(255, 255, 255, 0.03)' }}>
        <div className="d-flex align-items-center">
          <FaUserCircle className="text-warning me-2 flex-shrink-0" size={26} />
          <div className="text-truncate">
            <div className="text-white fw-bold small text-truncate">{userInfo.name}</div>
            <div className="text-white-50 text-truncate" style={{ fontSize: '0.75rem' }}>
              {userInfo.department}
            </div>
          </div>
        </div>
      </div>

      {/* Nav Menu */}
      <Nav className="flex-column mt-3 px-3 flex-grow-1">
        <Nav.Link 
          as={Link} 
          to="/dashboard/department_staff" 
          onClick={handleLinkClick}
          className={`civic-sidebar-link ${currentPath === '/dashboard/department_staff' ? 'active' : ''}`}
        >
          <FaTachometerAlt className="me-3 fs-5" /> 
          <span>Dashboard</span>
        </Nav.Link>
        
        <Nav.Link 
          as={Link} 
          to="/dashboard/department_staff/complaints" 
          onClick={handleLinkClick}
          className={`civic-sidebar-link ${currentPath.includes('/dashboard/department_staff/complaints') ? 'active' : ''}`}
        >
          <FaList className="me-3 fs-5" /> 
          <span>Assigned Tasks</span>
        </Nav.Link>
        
        <Nav.Link 
          as={Link} 
          to="/dashboard/department_staff/profile" 
          onClick={handleLinkClick}
          className={`civic-sidebar-link ${currentPath === '/dashboard/department_staff/profile' ? 'active' : ''}`}
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
