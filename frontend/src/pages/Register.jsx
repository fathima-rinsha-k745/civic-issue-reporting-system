import React, { useState } from 'react';
import { Container, Row, Col, Card, Form, Button, Alert, InputGroup } from 'react-bootstrap';
import { useNavigate, Link, useLocation } from 'react-router-dom';
import { FaEye, FaEyeSlash, FaUserPlus } from 'react-icons/fa';

const Register = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [formData, setFormData] = useState({
    fullName: '',
    email: '',
    password: '',
    confirmPassword: ''
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [validationErrors, setValidationErrors] = useState({});
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const searchParams = new URLSearchParams(location.search);
  const redirectTo = location.state?.redirectTo || searchParams.get('redirect');

  const handleChange = (e) => {
    const { id, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [id]: value
    }));
    // Clear validation error when user types
    if (validationErrors[id]) {
      setValidationErrors(prev => ({ ...prev, [id]: '' }));
    }
  };

  const validateForm = () => {
    const errors = {};
    if (!formData.fullName.trim()) errors.fullName = 'Full name is required';

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!formData.email) {
      errors.email = 'Email is required';
    } else if (!emailRegex.test(formData.email)) {
      errors.email = 'Please enter a valid email address';
    }

    if (!formData.password) {
      errors.password = 'Password is required';
    }

    if (!formData.confirmPassword) {
      errors.confirmPassword = 'Confirm password is required';
    } else if (formData.password !== formData.confirmPassword) {
      errors.confirmPassword = 'Passwords do not match';
    }

    setValidationErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    if (!validateForm()) return;

    setLoading(true);

    try {
      const payload = {
        username: formData.email,
        email: formData.email,
        password: formData.password,
        full_name: formData.fullName,
        role: 'CITIZEN'
      };

      const response = await fetch('/api/register/', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
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

        const backendErrors = {};
        let hasSpecificErrors = false;

        if (data.username) {
          backendErrors.email = data.username[0];
          hasSpecificErrors = true;
        }
        if (data.email) {
          backendErrors.email = data.email[0];
          hasSpecificErrors = true;
        }
        if (data.full_name) {
          backendErrors.fullName = data.full_name[0];
          hasSpecificErrors = true;
        }
        if (data.password) {
          backendErrors.password = data.password[0];
          hasSpecificErrors = true;
        }

        if (hasSpecificErrors) {
          setValidationErrors(prev => ({ ...prev, ...backendErrors }));
          throw new Error('Please fix the errors below.');
        }

        throw new Error(data?.detail || data?.message || data?.error || 'Registration failed. Please check your data.');
      }

      setSuccess('Registration successful! Redirecting to login...');
      setFormData({ fullName: '', email: '', password: '', confirmPassword: '' });

      setTimeout(() => {
        navigate('/citizen/login', { state: { redirectTo } });
      }, 1800);

    } catch (err) {
      setError(err.message || 'Server/network error occurred. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="civic-subpage-viewport d-flex flex-column justify-content-center py-5">
      {/* Background Gradient Overlay */}
      <div className="civic-subpage-overlay" />

      <Container className="position-relative" style={{ zIndex: 2, maxWidth: '1240px' }}>
        <div className="hero-top-spacer mb-2" />

        <Row className="justify-content-center">
          <Col md={8} lg={6} xl={5}>
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

            {/* Registration Card */}
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
                {/* Header Icon */}
                <div className="text-center mb-4">
                  <div
                    className="mx-auto rounded-circle d-flex align-items-center justify-content-center mb-3"
                    style={{
                      width: '56px',
                      height: '56px',
                      background: 'var(--civic-royal)',
                      boxShadow: '0 8px 24px rgba(37, 99, 235, 0.45)'
                    }}
                  >
                    <FaUserPlus size={24} className="text-white" />
                  </div>
                  <h2 className="text-white fw-bold fs-3 mb-1">Citizen Registration</h2>
                  <p className="text-white-50 small mb-0">Create an account to report & track civic issues</p>
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
                {success && (
                  <Alert
                    variant="success"
                    className="py-2 px-3 small border-0 text-white"
                    style={{ background: 'rgba(34, 197, 94, 0.3)', border: '1px solid rgba(34, 197, 94, 0.5)' }}
                  >
                    {success}
                  </Alert>
                )}

                <Form onSubmit={handleSubmit}>
                  <Form.Group className="mb-3" controlId="fullName">
                    <Form.Label className="text-white small fw-semibold">Full Name</Form.Label>
                    <Form.Control
                      type="text"
                      placeholder="Enter your full name"
                      value={formData.fullName}
                      onChange={handleChange}
                      isInvalid={!!validationErrors.fullName}
                      required
                      style={{
                        background: 'rgba(10, 22, 46, 0.75)',
                        border: '1px solid rgba(255, 255, 255, 0.2)',
                        color: '#ffffff',
                        borderRadius: '12px',
                        padding: '10px 14px'
                      }}
                    />
                    <Form.Control.Feedback type="invalid" className="small text-danger fw-semibold">
                      {validationErrors.fullName}
                    </Form.Control.Feedback>
                  </Form.Group>

                  <Form.Group className="mb-3" controlId="email">
                    <Form.Label className="text-white small fw-semibold">Email address</Form.Label>
                    <Form.Control
                      type="email"
                      placeholder="Enter your email"
                      value={formData.email}
                      onChange={handleChange}
                      isInvalid={!!validationErrors.email}
                      required
                      style={{
                        background: 'rgba(10, 22, 46, 0.75)',
                        border: '1px solid rgba(255, 255, 255, 0.2)',
                        color: '#ffffff',
                        borderRadius: '12px',
                        padding: '10px 14px'
                      }}
                    />
                    <Form.Control.Feedback type="invalid" className="small text-danger fw-semibold">
                      {validationErrors.email}
                    </Form.Control.Feedback>
                  </Form.Group>

                  <Form.Group className="mb-3" controlId="password">
                    <Form.Label className="text-white small fw-semibold">Password</Form.Label>
                    <InputGroup hasValidation>
                      <Form.Control
                        type={showPassword ? "text" : "password"}
                        placeholder="Create a password"
                        value={formData.password}
                        onChange={handleChange}
                        isInvalid={!!validationErrors.password}
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
                      <Form.Control.Feedback type="invalid" className="small text-danger fw-semibold">
                        {validationErrors.password}
                      </Form.Control.Feedback>
                    </InputGroup>
                  </Form.Group>

                  <Form.Group className="mb-4" controlId="confirmPassword">
                    <Form.Label className="text-white small fw-semibold">Confirm Password</Form.Label>
                    <InputGroup hasValidation>
                      <Form.Control
                        type={showConfirmPassword ? "text" : "password"}
                        placeholder="Re-enter password"
                        value={formData.confirmPassword}
                        onChange={handleChange}
                        isInvalid={!!validationErrors.confirmPassword}
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
                        onClick={() => setShowConfirmPassword(!showConfirmPassword)}
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
                        {showConfirmPassword ? <FaEyeSlash size={16} /> : <FaEye size={16} />}
                      </Button>
                      <Form.Control.Feedback type="invalid" className="small text-danger fw-semibold">
                        {validationErrors.confirmPassword}
                      </Form.Control.Feedback>
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
                    {loading ? 'Creating Account...' : 'Create Account'}
                  </Button>

                  <div className="text-center mt-3">
                    <small className="text-white-50">
                      Already have an account?{' '}
                      <Link
                        to="/citizen/login"
                        state={{ redirectTo }}
                        className="text-info fw-bold text-decoration-none"
                      >
                        Sign in here
                      </Link>
                    </small>
                  </div>
                </Form>
              </Card.Body>
            </Card>
          </Col>
        </Row>
      </Container>
    </div>
  );
};

export default Register;
