import React, { useState } from 'react';
import { Container, Row, Col, Card, Form, Button, Alert, InputGroup } from 'react-bootstrap';
import { useNavigate, Link, useLocation } from 'react-router-dom';
import { FaEye, FaEyeSlash, FaUser, FaLandmark, FaHardHat } from 'react-icons/fa';

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
      const userDetails = {
        role: data.role,
        full_name: data.full_name,
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

  // Determine icon & color based on role
  const getRoleBadge = () => {
    if (expectedRole === 'MUNICIPAL_AUTHORITY') {
      return {
        icon: <FaLandmark size={24} className="text-white" />,
        bg: 'var(--civic-teal)',
        subtitle: 'Review & manage municipal operations'
      };
    }
    if (expectedRole === 'DEPARTMENT_STAFF') {
      return {
        icon: <FaHardHat size={24} className="text-white" />,
        bg: 'var(--civic-amber)',
        subtitle: 'Field inspection & resolution portal'
      };
    }
    return {
      icon: <FaUser size={24} className="text-white" />,
      bg: 'var(--civic-royal)',
      subtitle: 'Report issues & track resolution progress'
    };
  };

  const roleBadge = getRoleBadge();

  return (
    <div className="civic-subpage-viewport d-flex flex-column justify-content-center py-5">
      {/* Background Gradient Overlay */}
      <div className="civic-subpage-overlay" />

      <Container className="position-relative" style={{ zIndex: 2, maxWidth: '1240px' }}>
        <div className="hero-top-spacer mb-2" />

        <Row className="justify-content-center">
          <Col md={7} lg={5} xl={4}>
            {/* Back link */}
            <div className="mb-3">
              <Link
                to="/"
                className="d-inline-flex align-items-center gap-2 text-decoration-none text-white-50"
                style={{ fontSize: '0.88rem', transition: 'color 0.2s' }}
              >
                <span>&larr; Back to Home</span>
              </Link>
            </div>

            {/* Login Card */}
            <Card
              className="border-0 shadow-lg overflow-hidden"
              style={{
                background: 'rgba(18, 38, 74, 0.72)',
                backdropFilter: 'blur(20px)',
                WebkitBackdropFilter: 'blur(20px)',
                border: '1px solid rgba(255, 255, 255, 0.2)',
                borderRadius: '24px',
                boxShadow: '0 20px 50px rgba(0, 0, 0, 0.45)'
              }}
            >
              <Card.Body className="p-4 p-sm-5">
                {/* Role Icon Circle */}
                <div className="text-center mb-3">
                  <div
                    className="mx-auto rounded-circle d-flex align-items-center justify-content-center mb-3"
                    style={{
                      width: '56px',
                      height: '56px',
                      background: roleBadge.bg,
                      boxShadow: '0 8px 24px rgba(0, 0, 0, 0.35)'
                    }}
                  >
                    {roleBadge.icon}
                  </div>
                  <h2 className="text-white fw-bold fs-3 mb-1">{title || 'Login'}</h2>
                  <p className="text-white-50 small mb-0">{roleBadge.subtitle}</p>
                </div>

                {error && (
                  <Alert
                    variant="danger"
                    className="py-2 px-3 small border-0 text-white"
                    style={{ background: 'rgba(239, 68, 68, 0.3)', border: '1px solid rgba(239, 68, 68, 0.5)' }}
                  >
                    {error}
                  </Alert>
                )}

                <Form onSubmit={handleSubmit}>
                  <Form.Group className="mb-3" controlId="email">
                    <Form.Label className="text-white small fw-semibold">Email address</Form.Label>
                    <Form.Control
                      type="email"
                      placeholder="Enter your email"
                      value={formData.email}
                      onChange={handleChange}
                      required
                      style={{
                        background: 'rgba(10, 22, 46, 0.75)',
                        border: '1px solid rgba(255, 255, 255, 0.2)',
                        color: '#ffffff',
                        borderRadius: '12px',
                        padding: '10px 14px'
                      }}
                    />
                  </Form.Group>

                  <Form.Group className="mb-4" controlId="password">
                    <Form.Label className="text-white small fw-semibold">Password</Form.Label>
                    <InputGroup>
                      <Form.Control
                        type={showPassword ? "text" : "password"}
                        placeholder="Enter password"
                        value={formData.password}
                        onChange={handleChange}
                        required
                        style={{
                          background: 'rgba(10, 22, 46, 0.75)',
                          border: '1px solid rgba(255, 255, 255, 0.2)',
                          color: '#ffffff',
                          borderTopLeftRadius: '12px',
                          borderBottomLeftRadius: '12px',
                          padding: '10px 14px'
                        }}
                      />
                      <Button
                        variant="link"
                        onClick={() => setShowPassword(!showPassword)}
                        className="text-white-50 d-flex align-items-center justify-content-center text-decoration-none"
                        style={{
                          background: 'rgba(10, 22, 46, 0.75)',
                          border: '1px solid rgba(255, 255, 255, 0.2)',
                          borderLeft: 'none',
                          borderTopRightRadius: '12px',
                          borderBottomRightRadius: '12px',
                          padding: '0 14px'
                        }}
                      >
                        {showPassword ? <FaEyeSlash size={16} /> : <FaEye size={16} />}
                      </Button>
                    </InputGroup>
                  </Form.Group>

                  <Button
                    variant="primary"
                    type="submit"
                    className="w-100 mb-3 fw-bold border-0"
                    disabled={loading}
                    style={{
                      background: 'var(--civic-royal)',
                      borderRadius: '9999px',
                      padding: '11px 0',
                      boxShadow: '0 4px 14px rgba(37, 99, 235, 0.45)'
                    }}
                  >
                    {loading ? 'Signing In...' : 'Sign In'}
                  </Button>

                  {expectedRole === 'CITIZEN' && (
                    <div className="text-center mt-3">
                      <small className="text-white-50">
                        Don't have an account?{' '}
                        <Link
                          to="/register"
                          state={{ redirectTo }}
                          className="text-info fw-bold text-decoration-none"
                        >
                          Register here
                        </Link>
                      </small>
                    </div>
                  )}
                </Form>
              </Card.Body>
            </Card>
          </Col>
        </Row>
      </Container>
    </div>
  );
};

export default Login;
