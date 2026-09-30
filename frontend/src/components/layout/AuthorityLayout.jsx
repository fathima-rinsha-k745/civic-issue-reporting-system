import React, { useEffect, useState } from 'react';
import { Outlet, useNavigate } from 'react-router-dom';
import Sidebar from '../authority/Sidebar';
import { FaUserCircle, FaLandmark } from 'react-icons/fa';

const AuthorityLayout = () => {
  const navigate = useNavigate();
  const [userName, setUserName] = useState('');

  useEffect(() => {
    const userStr = localStorage.getItem('user');
    if (!userStr) {
      navigate('/');
      return;
    }
    try {
      const user = JSON.parse(userStr);
      if (user.role !== 'MUNICIPAL_AUTHORITY') {
        navigate('/');
      } else {
        setUserName(user.full_name || user.email || 'Authority User');
      }
    } catch (e) {
      navigate('/');
    }
  }, [navigate]);

  return (
    <div className="d-flex" style={{ minHeight: '100vh', backgroundColor: '#F4F7F6' }}>
      <div className="d-none d-md-block" style={{ zIndex: 100 }}>
        <Sidebar />
      </div>
      <div className="flex-grow-1 d-flex flex-column" style={{ overflowY: 'auto', overflowX: 'hidden', height: '100vh', minWidth: 0 }}>
        {/* Top Header */}
        <header className="bg-white shadow-sm px-4 py-3 d-flex justify-content-between align-items-center" style={{ zIndex: 10 }}>
          <div className="d-flex align-items-center text-truncate">
            <FaLandmark size={24} className="me-3 flex-shrink-0" style={{ color: '#0B1B3D' }} />
            <h5 className="mb-0 fw-bold text-truncate" style={{ color: '#0B1B3D' }}>Civic Issue Reporting System</h5>
          </div>
          <div className="d-flex align-items-center border-start ps-4 ms-3 flex-shrink-0">
            <FaUserCircle className="text-secondary me-3" size={36} />
            <div className="d-none d-sm-flex flex-column text-truncate">
              <span className="fw-bold text-dark lh-1 text-truncate">{userName}</span>
              <small className="text-muted lh-1 mt-1 text-truncate">Municipal Authority</small>
            </div>
          </div>
        </header>
        {/* Main Content Area */}
        <main className="flex-grow-1 p-3 p-md-5 w-100 mx-auto" style={{ maxWidth: '100%' }}>
          <Outlet />
        </main>
      </div>
    </div>
  );
};
export default AuthorityLayout;
