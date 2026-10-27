import React, { useState } from 'react';
import { Container, Row, Col, Form, Alert } from 'react-bootstrap';
import { useNavigate, Link, useLocation } from 'react-router-dom';
import {
  FaEye,
  FaEyeSlash,
  FaUser,
  FaLandmark,
  FaHardHat,
  FaEnvelope,
  FaLock,
  FaArrowLeft
} from 'react-icons/fa';

const Login = ({ expectedRole, title }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const [formData, setFormData] = useState({
    email: '',
    password: ''
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  const searchParams = new URLSearchParams(location.search);
  const redirectTo = location.state?.redirectTo || searchParams.get('redirect');

  const handleChange = (e) => {
    const { id, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [id]: value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (!formData.email || !formData.password) {
      setError('Please provide both email and password.');
      return;
    }

    setLoading(true);

    try {
      const response = await fetch('/api/login/', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({ ...formData, expected_role: expectedRole }),
      });

      let data = null;
      const contentType = response.headers.get("content-type");
      if (contentType && contentType.indexOf("application/json") !== -1) {
        data = await response.json().catch(() => null);
      }

      if (!response.ok) {
        if (!data) {
          throw new Error(`Server returned status ${response.status}: ${response.statusText}`);
        }
        throw new Error(data?.error || data?.detail || data?.message || 'Login failed. Please check your credentials.');
      }

      // Successful login
      const role = data.role;
      const citizenName = (data.full_name || data.fullName || data.name || data.first_name || data.username || '').trim();
      const userDetails = {
        id: data.id || data.user_id,
        user_id: data.user_id || data.id,
        staff_id: data.staff_id || null,
        role: data.role,
        full_name: citizenName,
        first_name: data.first_name || '',
        username: data.username || '',
        email: data.email || formData.email,
        department: data.department || null,
      };
      localStorage.setItem('user', JSON.stringify(userDetails));

      // Redirect based on role
      if (role === 'CITIZEN') {
        if (redirectTo) {
          navigate(redirectTo);
        } else {
          navigate('/dashboard/citizen');
        }
      } else if (role === 'MUNICIPAL_AUTHORITY') {
        navigate('/dashboard/municipal_authority');
      } else if (role === 'DEPARTMENT_STAFF') {
        navigate('/dashboard/department_staff');
      } else {
        navigate('/dashboard'); // fallback
      }

    } catch (err) {
      setError(err.message || 'Server/network error occurred. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // Determine icon, glow, & color based on role
  const getRoleBadge = () => {
    if (expectedRole === 'MUNICIPAL_AUTHORITY') {
      return {
        icon: <FaLandmark size={22} className="text-white" />,
        bg: '#0284c7',
        glow: '0 0 24px rgba(2, 132, 199, 0.7)',
        subtitle: 'Review & manage municipal operations'
      };
    }
    if (expectedRole === 'DEPARTMENT_STAFF') {
      return {
        icon: <FaHardHat size={22} className="text-white" />,
        bg: '#d97706',
        glow: '0 0 24px rgba(217, 119, 6, 0.7)',
        subtitle: 'Field inspection & resolution portal'
      };
    }
    return {
      icon: <FaUser size={22} className="text-white" />,
      bg: '#2563EB',
      glow: '0 0 24px rgba(37, 99, 235, 0.7)',
      subtitle: 'Sign in to report & track civic issues'
    };
  };

  const roleBadge = getRoleBadge();

  return (
    <div className="civic-auth-viewport position-relative">
      {/* Background Split Gradient Overlay */}
      <div className="civic-auth-overlay" />

      {/* Main Auth Container */}
      <Container className="civic-auth-content position-relative">
        {/* Top spacer for floating navbar */}
        <div className="hero-top-spacer" />

        {/* Center / Form Section - Left-Aligned matching reference */}
        <div className="my-auto py-3 py-lg-4">
          <Row className="align-items-center">
            <Col xl={5} lg={6} md={8} sm={11} className="mx-auto mx-lg-0 ms-lg-3 ms-xl-5">
              <div className="d-flex flex-column">
                {/* Back Link */}
                <Link to="/" className="auth-back-link">
                  <FaArrowLeft size={11} />
                  <span>Back to Home</span>
                </Link>

                {/* Login Card */}
                <div className="civic-auth-card">
                  {/* Glowing Role Avatar Circle */}
                  <div
                    className="auth-avatar-circle"
                    style={{
                      background: roleBadge.bg,
                      boxShadow: roleBadge.glow
                    }}
                  >
                    {roleBadge.icon}
                  </div>

                  {/* Title & Subtitle */}
                  <h1 className="auth-card-title">{title || 'Sign In'}</h1>
                  <p className="auth-card-subtitle">{roleBadge.subtitle}</p>

                  {error && (
                    <Alert
                      variant="danger"
                      className="py-2 px-3 small border-0 text-white mb-3"
                      style={{ background: 'rgba(239, 68, 68, 0.3)', border: '1px solid rgba(239, 68, 68, 0.5)', borderRadius: '10px' }}
                    >
                      {error}
                    </Alert>
                  )}

                  <Form onSubmit={handleSubmit} noValidate>
                    {/* Email address */}
                    <Form.Group className="mb-3" controlId="email">
                      <Form.Label className="auth-form-label">Email address</Form.Label>
                      <div className="auth-input-wrapper">
                        <span className="auth-input-left-icon">
                          <FaEnvelope size={14} />
                        </span>
                        <Form.Control
                          type="email"
                          placeholder="Enter your email"
                          value={formData.email}
                          onChange={handleChange}
                          required
                          className="auth-form-control"
                        />
                      </div>
                    </Form.Group>

                    {/* Password */}
                    <Form.Group className="mb-4" controlId="password">
                      <Form.Label className="auth-form-label">Password</Form.Label>
                      <div className="auth-input-wrapper">
                        <span className="auth-input-left-icon">
                          <FaLock size={14} />
                        </span>
                        <Form.Control
                          type={showPassword ? "text" : "password"}
                          placeholder="Enter your password"
                          value={formData.password}
                          onChange={handleChange}
                          required
                          className="auth-form-control has-right-btn"
                        />
                        <button
                          type="button"
                          onClick={() => setShowPassword(!showPassword)}
                          className="auth-input-right-btn"
                          aria-label={showPassword ? "Hide password" : "Show password"}
                        >
                          {showPassword ? <FaEyeSlash size={15} /> : <FaEye size={15} />}
                        </button>
                      </div>
                    </Form.Group>

                    {/* Submit Button */}
                    <button
                      type="submit"
                      className="auth-submit-btn"
                      disabled={loading}
                    >
                      {loading ? 'Signing In...' : 'Sign In'}
                    </button>

                    {/* Bottom Link Divider */}
                    {expectedRole === 'CITIZEN' ? (
                      <div className="d-flex align-items-center justify-content-center gap-2 mt-4 pt-1">
                        <div className="auth-divider-line flex-grow-1" />
                        <span className="auth-footer-text">
                          Don't have an account?{' '}
                          <Link
                            to="/register"
                            state={{ redirectTo }}
                            className="auth-footer-link"
                          >
                            Register here
                          </Link>
                        </span>
                        <div className="auth-divider-line flex-grow-1" />
                      </div>
                    ) : (
                      <div className="d-flex align-items-center justify-content-center gap-2 mt-4 pt-1">
                        <div className="auth-divider-line flex-grow-1" />
                        <span className="auth-footer-text">
                          Need portal assistance?{' '}
                          <Link to="/contact" className="auth-footer-link">
                            Contact Support
                          </Link>
                        </span>
                        <div className="auth-divider-line flex-grow-1" />
                      </div>
                    )}
                  </Form>
                </div>
              </div>
            </Col>
          </Row>
        </div>

        {/* Bottom spacer */}
        <div className="hero-bottom-spacer pb-2" />
      </Container>
    </div>
  );
};

export default Login;
