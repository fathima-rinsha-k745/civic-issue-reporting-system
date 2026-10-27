import React, { useState } from 'react';
import { Container, Row, Col, Form, Alert } from 'react-bootstrap';
import { useNavigate, Link, useLocation } from 'react-router-dom';
import {
  FaEye,
  FaEyeSlash,
  FaUserPlus,
  FaUser,
  FaEnvelope,
  FaLock,
  FaArrowLeft
} from 'react-icons/fa';

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

                {/* Registration Card */}
                <div className="civic-auth-card">
                  {/* Glowing Blue Avatar Circle */}
                  <div className="auth-avatar-circle">
                    <FaUserPlus size={22} className="text-white" />
                  </div>

                  {/* Title & Subtitle */}
                  <h1 className="auth-card-title">Citizen Registration</h1>
                  <p className="auth-card-subtitle">
                    Create an account to report & track civic issues
                  </p>

                  {error && (
                    <Alert
                      variant="danger"
                      className="py-2 px-3 small border-0 text-white mb-3"
                      style={{ background: 'rgba(239, 68, 68, 0.3)', border: '1px solid rgba(239, 68, 68, 0.5)', borderRadius: '10px' }}
                    >
                      {error}
                    </Alert>
                  )}
                  {success && (
                    <Alert
                      variant="success"
                      className="py-2 px-3 small border-0 text-white mb-3"
                      style={{ background: 'rgba(34, 197, 94, 0.3)', border: '1px solid rgba(34, 197, 94, 0.5)', borderRadius: '10px' }}
                    >
                      {success}
                    </Alert>
                  )}

                  <Form onSubmit={handleSubmit} noValidate>
                    {/* Full Name */}
                    <Form.Group className="mb-3" controlId="fullName">
                      <Form.Label className="auth-form-label">Full Name</Form.Label>
                      <div className="auth-input-wrapper">
                        <span className="auth-input-left-icon">
                          <FaUser size={14} />
                        </span>
                        <Form.Control
                          type="text"
                          placeholder="Enter your full name"
                          value={formData.fullName}
                          onChange={handleChange}
                          isInvalid={!!validationErrors.fullName}
                          required
                          className="auth-form-control"
                        />
                      </div>
                      {validationErrors.fullName && (
                        <div className="auth-error-feedback">{validationErrors.fullName}</div>
                      )}
                    </Form.Group>

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
                          isInvalid={!!validationErrors.email}
                          required
                          className="auth-form-control"
                        />
                      </div>
                      {validationErrors.email && (
                        <div className="auth-error-feedback">{validationErrors.email}</div>
                      )}
                    </Form.Group>

                    {/* Password */}
                    <Form.Group className="mb-3" controlId="password">
                      <Form.Label className="auth-form-label">Password</Form.Label>
                      <div className="auth-input-wrapper">
                        <span className="auth-input-left-icon">
                          <FaLock size={14} />
                        </span>
                        <Form.Control
                          type={showPassword ? "text" : "password"}
                          placeholder="Create a password"
                          value={formData.password}
                          onChange={handleChange}
                          isInvalid={!!validationErrors.password}
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
                      {validationErrors.password && (
                        <div className="auth-error-feedback">{validationErrors.password}</div>
                      )}
                    </Form.Group>

                    {/* Confirm Password */}
                    <Form.Group className="mb-4" controlId="confirmPassword">
                      <Form.Label className="auth-form-label">Confirm Password</Form.Label>
                      <div className="auth-input-wrapper">
                        <span className="auth-input-left-icon">
                          <FaLock size={14} />
                        </span>
                        <Form.Control
                          type={showConfirmPassword ? "text" : "password"}
                          placeholder="Re-enter password"
                          value={formData.confirmPassword}
                          onChange={handleChange}
                          isInvalid={!!validationErrors.confirmPassword}
                          required
                          className="auth-form-control has-right-btn"
                        />
                        <button
                          type="button"
                          onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                          className="auth-input-right-btn"
                          aria-label={showConfirmPassword ? "Hide password" : "Show password"}
                        >
                          {showConfirmPassword ? <FaEyeSlash size={15} /> : <FaEye size={15} />}
                        </button>
                      </div>
                      {validationErrors.confirmPassword && (
                        <div className="auth-error-feedback">{validationErrors.confirmPassword}</div>
                      )}
                    </Form.Group>

                    {/* Submit Button */}
                    <button
                      type="submit"
                      className="auth-submit-btn"
                      disabled={loading}
                    >
                      {loading ? 'Creating Account...' : 'Create Account'}
                    </button>

                    {/* Bottom Link Divider */}
                    <div className="d-flex align-items-center justify-content-center gap-2 mt-4 pt-1">
                      <div className="auth-divider-line flex-grow-1" />
                      <span className="auth-footer-text">
                        Already have an account?{' '}
                        <Link
                          to="/citizen/login"
                          state={{ redirectTo }}
                          className="auth-footer-link"
                        >
                          Sign in here
                        </Link>
                      </span>
                      <div className="auth-divider-line flex-grow-1" />
                    </div>
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

export default Register;
