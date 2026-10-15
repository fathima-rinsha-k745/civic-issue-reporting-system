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
    <div className="d-flex flex-column h-100" style={{ minHeight: '100%', width: '100%', backgroundColor: '#0B1B3D' }}>
      <div className="p-4 border-bottom" style={{ borderColor: 'rgba(255,255,255,0.1)' }}>
        <h5 className="mb-0 text-white d-flex align-items-center">
          <FaHardHat className="me-2" /> CivicConnect
        </h5>
        <small className="text-light opacity-75">Department Tasks</small>
      </div>

      {/* Staff profile summary badge */}
      <div className="px-4 py-3 border-bottom" style={{ borderColor: 'rgba(255,255,255,0.1)' }}>
        <div className="d-flex align-items-center">
          <FaUserCircle className="text-white-50 me-2 flex-shrink-0" size={26} />
          <div className="text-truncate">
            <div className="text-white fw-bold small text-truncate">{userInfo.name}</div>
            <div className="text-light opacity-75 text-truncate" style={{ fontSize: '0.75rem' }}>
              {userInfo.department}
            </div>
          </div>
        </div>
      </div>

      <Nav className="flex-column mt-3 px-3 flex-grow-1">
        <Nav.Link 
          as={Link} 
          to="/dashboard/department_staff" 
          onClick={handleLinkClick}
          className={`px-4 py-3 mb-2 rounded d-flex align-items-center ${currentPath === '/dashboard/department_staff' ? 'bg-primary fw-bold' : ''}`}
          style={{ color: '#FFFFFF' }}
        >
          <FaTachometerAlt className="me-3 fs-5" style={{ color: '#FFFFFF' }} /> 
          <span style={{ color: '#FFFFFF' }}>Dashboard</span>
        </Nav.Link>
        
        <Nav.Link 
          as={Link} 
          to="/dashboard/department_staff/complaints" 
          onClick={handleLinkClick}
          className={`px-4 py-3 mb-2 rounded d-flex align-items-center ${currentPath.includes('/dashboard/department_staff/complaints') ? 'bg-primary fw-bold' : ''}`}
          style={{ color: '#FFFFFF' }}
        >
          <FaList className="me-3 fs-5" style={{ color: '#FFFFFF' }} /> 
          <span style={{ color: '#FFFFFF' }}>Assigned Complaints</span>
        </Nav.Link>
        
        <Nav.Link 
          as={Link} 
          to="/dashboard/department_staff/profile" 
          onClick={handleLinkClick}
          className={`px-4 py-3 mb-2 rounded d-flex align-items-center ${currentPath === '/dashboard/department_staff/profile' ? 'bg-primary fw-bold' : ''}`}
          style={{ color: '#FFFFFF' }}
        >
          <FaUser className="me-3 fs-5" style={{ color: '#FFFFFF' }} /> 
          <span style={{ color: '#FFFFFF' }}>Profile</span>
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
