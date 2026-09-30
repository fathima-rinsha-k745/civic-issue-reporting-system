import React, { useState } from 'react';
import { Container, Row, Col, Card, Form, Button, Alert } from 'react-bootstrap';
import { useNavigate, Link } from 'react-router-dom';

const Register = () => {
  const navigate = useNavigate();
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
          setValidationErrors(prev => ({...prev, ...backendErrors}));
          throw new Error('Please fix the errors below.');
        }

        throw new Error(data?.detail || data?.message || data?.error || 'Registration failed. Please check your data.');
      }

      setSuccess('Registration successful. Please login.');
      setFormData({ fullName: '', email: '', password: '', confirmPassword: '' });
      
      setTimeout(() => {
        navigate('/citizen/login');
      }, 2000);

    } catch (err) {
      setError(err.message || 'Server/network error occurred. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ 
      minHeight: 'calc(100vh - 76px)', 
      backgroundImage: 'linear-gradient(rgba(11, 27, 61, 0.7), rgba(11, 27, 61, 0.7)), url(/hero-civic.jpg)',
      backgroundSize: 'cover',
      backgroundPosition: 'center',
      backgroundAttachment: 'fixed',
      display: 'flex',
      flexDirection: 'column',
      justifyContent: 'center',
      padding: '40px 0'
    }}>
      <Container className="position-relative" style={{ zIndex: 1 }}>
        <Row className="justify-content-center">
          <Col md={6} lg={5}>
            <div className="mb-3">
              <Link to="/" className="text-decoration-none text-light opacity-75 hover-white">
                &larr; Back to Role Selection
              </Link>
            </div>
            <Card className="border-0 shadow-lg overflow-hidden" style={{ 
              background: 'rgba(255, 255, 255, 0.15)',
              backdropFilter: 'blur(12px)',
              WebkitBackdropFilter: 'blur(12px)',
              border: '1px solid rgba(255, 255, 255, 0.3)',
              borderRadius: '16px',
            }}>
              <Card.Body className="p-4 p-md-5">
                <h2 className="text-center mb-4 text-white fw-bold">Register</h2>
                
                {error && <Alert variant="danger">{error}</Alert>}
                {success && <Alert variant="success">{success}</Alert>}

                <Form onSubmit={handleSubmit}>
                  <Form.Group className="mb-3" controlId="fullName">
                    <Form.Label className="text-white">Full Name</Form.Label>
                    <Form.Control 
                      type="text" 
                      placeholder="Enter your full name" 
                      value={formData.fullName}
                      onChange={handleChange}
                      isInvalid={!!validationErrors.fullName}
                      className="bg-light border-0 shadow-none"
                    />
                    <Form.Control.Feedback type="invalid">{validationErrors.fullName}</Form.Control.Feedback>
                  </Form.Group>

                  <Form.Group className="mb-3" controlId="email">
                    <Form.Label className="text-white">Email address</Form.Label>
                    <Form.Control 
                      type="email" 
                      placeholder="Enter email" 
                      value={formData.email}
                      onChange={handleChange}
                      isInvalid={!!validationErrors.email}
                      className="bg-light border-0 shadow-none"
                    />
                    <Form.Control.Feedback type="invalid">{validationErrors.email}</Form.Control.Feedback>
                  </Form.Group>

                  <Form.Group className="mb-3" controlId="password">
                    <Form.Label className="text-white">Password</Form.Label>
                    <Form.Control 
                      type="password" 
                      placeholder="Password" 
                      value={formData.password}
                      onChange={handleChange}
                      isInvalid={!!validationErrors.password}
                      className="bg-light border-0 shadow-none"
                    />
                    <Form.Control.Feedback type="invalid">{validationErrors.password}</Form.Control.Feedback>
                  </Form.Group>

                  <Form.Group className="mb-4" controlId="confirmPassword">
                    <Form.Label className="text-white">Confirm Password</Form.Label>
                    <Form.Control 
                      type="password" 
                      placeholder="Confirm Password" 
                      value={formData.confirmPassword}
                      onChange={handleChange}
                      isInvalid={!!validationErrors.confirmPassword}
                      className="bg-light border-0 shadow-none"
                    />
                    <Form.Control.Feedback type="invalid">{validationErrors.confirmPassword}</Form.Control.Feedback>
                  </Form.Group>

                  <Button 
                    variant="primary" 
                    type="submit" 
                    className="w-100 mb-3 fw-bold shadow-sm" 
                    disabled={loading}
                    style={{ backgroundColor: '#0d6efd', border: 'none', borderRadius: '8px', padding: '10px 0' }}
                  >
                    {loading ? 'Registering...' : 'Register'}
                  </Button>
                  
                  <div className="text-center mt-3">
                    <small className="text-light opacity-75">
                      Already have an account? <Link to="/citizen/login" className="text-white fw-bold text-decoration-none hover-white">Login here</Link>
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
