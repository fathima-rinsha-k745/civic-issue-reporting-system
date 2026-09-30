import React from 'react';
import { Nav } from 'react-bootstrap';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { FaTachometerAlt, FaSignOutAlt, FaListUl, FaBuilding, FaUsers } from 'react-icons/fa';

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
  const isComplaintsActive = currentPath.includes('/dashboard/municipal_authority/complaints');
  const isDashboardActive = currentPath === '/dashboard/municipal_authority';

  return (
    <div className="d-flex flex-column" style={{ minHeight: '100vh', width: '260px', backgroundColor: '#0B1B3D' }}>
      <Nav className="flex-column mt-4 px-3">
        <Nav.Link 
          as={Link} 
          to="/dashboard/municipal_authority" 
          className={`px-4 py-3 mb-2 rounded d-flex align-items-center ${isDashboardActive ? 'bg-primary fw-bold' : ''}`}
          style={{ color: '#FFFFFF' }}
        >
          <FaTachometerAlt className="me-3 fs-5" style={{ color: '#FFFFFF' }} /> 
          <span style={{ color: '#FFFFFF' }}>Dashboard</span>
        </Nav.Link>
        
        <Nav.Link 
          as={Link} 
          to="/dashboard/municipal_authority/complaints" 
          className={`px-4 py-3 mb-2 rounded d-flex align-items-center ${isComplaintsActive ? 'bg-primary fw-bold' : ''}`}
          style={{ color: '#FFFFFF' }}
        >
          <FaListUl className="me-3 fs-5" style={{ color: '#FFFFFF' }} /> 
          <span style={{ color: '#FFFFFF' }}>View Complaints</span>
        </Nav.Link>

        <Nav.Link 
          as={Link} 
          to="/dashboard/municipal_authority/departments" 
          className={`px-4 py-3 mb-2 rounded d-flex align-items-center ${isActive('/dashboard/municipal_authority/departments') ? 'bg-primary fw-bold' : ''}`}
          style={{ color: '#FFFFFF' }}
        >
          <FaBuilding className="me-3 fs-5" style={{ color: '#FFFFFF' }} /> 
          <span style={{ color: '#FFFFFF' }}>Manage Departments</span>
        </Nav.Link>

        <Nav.Link 
          as={Link} 
          to="/dashboard/municipal_authority/staff" 
          className={`px-4 py-3 mb-2 rounded d-flex align-items-center ${isActive('/dashboard/municipal_authority/staff') ? 'bg-primary fw-bold' : ''}`}
          style={{ color: '#FFFFFF' }}
        >
          <FaUsers className="me-3 fs-5" style={{ color: '#FFFFFF' }} /> 
          <span style={{ color: '#FFFFFF' }}>Manage Staff</span>
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
