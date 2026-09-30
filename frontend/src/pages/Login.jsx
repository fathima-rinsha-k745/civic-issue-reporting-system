import React, { useState } from 'react';
import { Container, Row, Col, Card, Form, Button, Alert } from 'react-bootstrap';
import { useNavigate, Link } from 'react-router-dom';

const Login = ({ expectedRole, title }) => {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    email: '',
    password: ''
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

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
        email: formData.email
      };
      localStorage.setItem('user', JSON.stringify(userDetails));
      
      // Redirect based on role
      if (role === 'CITIZEN') {
        navigate('/dashboard/citizen');
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
                <h2 className="text-center mb-4 text-white fw-bold">{title || 'Login'}</h2>
                
                {error && <Alert variant="danger">{error}</Alert>}

                <Form onSubmit={handleSubmit}>
                  <Form.Group className="mb-3" controlId="email">
                    <Form.Label className="text-white">Email address</Form.Label>
                    <Form.Control 
                      type="email" 
                      placeholder="Enter email" 
                      value={formData.email}
                      onChange={handleChange}
                      className="bg-light border-0 shadow-none"
                    />
                  </Form.Group>

                  <Form.Group className="mb-4" controlId="password">
                    <Form.Label className="text-white">Password</Form.Label>
                    <Form.Control 
                      type="password" 
                      placeholder="Password" 
                      value={formData.password}
                      onChange={handleChange}
                      className="bg-light border-0 shadow-none"
                    />
                  </Form.Group>

                  <Button 
                    variant="primary" 
                    type="submit" 
                    className="w-100 mb-3 fw-bold shadow-sm" 
                    disabled={loading}
                    style={{ backgroundColor: '#0d6efd', border: 'none', borderRadius: '8px', padding: '10px 0' }}
                  >
                    {loading ? 'Logging in...' : 'Login'}
                  </Button>
                  
                  {expectedRole === 'CITIZEN' && (
                    <div className="text-center mt-3">
                      <small className="text-light opacity-75">
                        Don't have an account? <Link to="/register" className="text-white fw-bold text-decoration-none hover-white">Register here</Link>
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
