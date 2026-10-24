import React, { useState, useEffect, useRef } from 'react';
import { Container } from 'react-bootstrap';
import { Link, useLocation } from 'react-router-dom';
import { FaLandmark, FaBars, FaTimes, FaChevronDown, FaHardHat } from 'react-icons/fa';

const Header = () => {
  const location = useLocation();
  const currentPath = location.pathname;
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [loginDropdownOpen, setLoginDropdownOpen] = useState(false);
  const dropdownRef = useRef(null);

  const navLinks = [
    { name: 'Home', path: '/' },
    { name: 'About Us', path: '/about' },
    { name: 'Services', path: '/services' },
    { name: 'Contact Us', path: '/contact' },
  ];

  const handleLinkClick = () => {
    setMobileMenuOpen(false);
    setLoginDropdownOpen(false);
  };

  // Close dropdown on outside click
  useEffect(() => {
    const handleOutsideClick = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setLoginDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleOutsideClick);
    return () => document.removeEventListener('mousedown', handleOutsideClick);
  }, []);

  // Close on Escape key
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') {
        setLoginDropdownOpen(false);
        setMobileMenuOpen(false);
      }
    };
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, []);

  const isLoginActive = ['/authority/login', '/staff/login'].includes(currentPath);

  return (
    <header className="civic-header-wrapper" role="banner">
      <Container className="civic-header-container">
        <nav 
          className="civic-glass-navbar d-flex align-items-center justify-content-between" 
          aria-label="Main Navigation"
        >
          {/* Left: CivicConnect Logo & Brand */}
          <Link 
            to="/" 
            className="civic-glass-brand text-decoration-none d-flex align-items-center gap-2" 
            onClick={handleLinkClick}
          >
            <div className="civic-brand-icon-box d-flex align-items-center justify-content-center">
              <FaLandmark size={20} className="civic-brand-icon" />
            </div>
            <span className="civic-brand-text">
              Civic<span className="civic-brand-accent">Connect</span>
            </span>
          </Link>

          {/* Desktop Navigation Links + Login Dropdown */}
          <div className="d-none d-lg-flex align-items-center gap-1 civic-desktop-nav">
            {navLinks.map((link) => {
              const isActive = currentPath === link.path;
              return (
                <Link
                  key={link.name}
                  to={link.path}
                  className={`civic-glass-nav-link text-decoration-none ${isActive ? 'active' : ''}`}
                >
                  {link.name}
                </Link>
              );
            })}

            {/* Login Dropdown for Municipal Authority and Department Staff */}
            <div className="position-relative" ref={dropdownRef}>
              <button
                type="button"
                className={`civic-glass-nav-link civic-login-dropdown-btn border-0 bg-transparent text-decoration-none d-inline-flex align-items-center gap-1 ${isLoginActive || loginDropdownOpen ? 'active' : ''}`}
                onClick={() => setLoginDropdownOpen(prev => !prev)}
                aria-expanded={loginDropdownOpen}
                aria-haspopup="true"
              >
                <span>Login</span>
                <FaChevronDown 
                  size={10} 
                  className={`civic-dropdown-chevron ${loginDropdownOpen ? 'open' : ''}`} 
                />
              </button>

              {/* Dropdown Menu styled with the action cards glass styling */}
              {loginDropdownOpen && (
                <div className="civic-glass-dropdown-menu" role="menu">
                  <div className="civic-dropdown-label">
                    Portal Login
                  </div>
                  
                  {/* Municipal Authority */}
                  <Link
                    to="/authority/login"
                    className="civic-dropdown-item d-flex align-items-center gap-3 text-decoration-none"
                    onClick={handleLinkClick}
                    role="menuitem"
                  >
                    <div className="civic-dropdown-icon-box municipal-dropdown-icon d-flex align-items-center justify-content-center flex-shrink-0">
                      <FaLandmark size={15} className="text-white" />
                    </div>
                    <div>
                      <div className="civic-dropdown-title">Municipal Authority</div>
                      <div className="civic-dropdown-desc">Review & assign complaints</div>
                    </div>
                  </Link>

                  {/* Department Staff */}
                  <Link
                    to="/staff/login"
                    className="civic-dropdown-item d-flex align-items-center gap-3 text-decoration-none"
                    onClick={handleLinkClick}
                    role="menuitem"
                  >
                    <div className="civic-dropdown-icon-box staff-dropdown-icon d-flex align-items-center justify-content-center flex-shrink-0">
                      <FaHardHat size={15} className="text-white" />
                    </div>
                    <div>
                      <div className="civic-dropdown-title">Department Staff</div>
                      <div className="civic-dropdown-desc">Field tasks & resolution</div>
                    </div>
                  </Link>
                </div>
              )}
            </div>
          </div>

          {/* Mobile Hamburger Toggle */}
          <button
            type="button"
            className="civic-mobile-toggle d-lg-none d-flex align-items-center justify-content-center border-0 bg-transparent"
            onClick={() => setMobileMenuOpen(prev => !prev)}
            aria-expanded={mobileMenuOpen}
            aria-label="Toggle navigation menu"
          >
            {mobileMenuOpen ? <FaTimes size={18} /> : <FaBars size={18} />}
          </button>
        </nav>

        {/* Mobile Dropdown Nav Menu */}
        {mobileMenuOpen && (
          <div className="civic-glass-mobile-menu d-lg-none mt-2 p-2">
            <div className="d-flex flex-column gap-1">
              {navLinks.map((link) => {
                const isActive = currentPath === link.path;
                return (
                  <Link
                    key={link.name}
                    to={link.path}
                    onClick={handleLinkClick}
                    className={`civic-glass-nav-link-mobile text-decoration-none ${isActive ? 'active' : ''}`}
                  >
                    {link.name}
                  </Link>
                );
              })}

              <div className="civic-mobile-dropdown-section pt-2 mt-2 border-top border-white border-opacity-10">
                <div className="px-3 py-1 text-white-50 text-uppercase" style={{ fontSize: '0.72rem', letterSpacing: '1.2px', fontWeight: 600 }}>
                  Portal Login
                </div>
                <Link
                  to="/authority/login"
                  onClick={handleLinkClick}
                  className="civic-glass-nav-link-mobile d-flex align-items-center gap-2 text-decoration-none"
                >
                  <FaLandmark size={14} style={{ color: '#2DD4BF' }} />
                  <span>Municipal Authority</span>
                </Link>
                <Link
                  to="/staff/login"
                  onClick={handleLinkClick}
                  className="civic-glass-nav-link-mobile d-flex align-items-center gap-2 text-decoration-none"
                >
                  <FaHardHat size={14} style={{ color: '#FBBF24' }} />
                  <span>Department Staff</span>
                </Link>
              </div>
            </div>
          </div>
        )}
      </Container>
    </header>
  );
};

export default Header;


