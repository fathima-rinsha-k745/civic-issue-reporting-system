import React, { useState, useEffect } from 'react';
import { Card, Form, Button, Spinner, Container } from 'react-bootstrap';
import { FaUserCircle } from 'react-icons/fa';
import { api } from '../../services/api';
import { useNavigate, useLocation } from 'react-router-dom';

const Profile = () => {
  const [user, setUser] = useState({ fullName: '', email: '', role: '', department: '' });
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();
  const location = useLocation();
  const [successMessage, setSuccessMessage] = useState(location.state?.successMessage || '');

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        setLoading(true);
        const profileData = await api.getProfile();
        setUser(profileData);
      } catch (error) {
        console.error("Failed to load profile", error);
      } finally {
        setLoading(false);
      }
    };
    
    fetchProfile();
    
    // Clear the location state so the message doesn't persist on refresh
    if (location.state?.successMessage) {
      window.history.replaceState({}, document.title);
    }
  }, [location]);

  if (loading) {
    return (
      <div className="text-center py-5">
        <Spinner animation="border" variant="primary" />
      </div>
    );
  }

  return (
    <Container className="py-2 px-0 px-sm-2" style={{ maxWidth: '700px', marginLeft: 0 }}>
      <h2 className="mb-3 mb-sm-4 text-dark fw-bold fs-3 fs-sm-2">My Profile</h2>
      
      <Card className="border-0 shadow-sm">
        <Card.Body className="p-3 p-sm-4 p-md-5">
          {successMessage && <div className="alert alert-success mb-4">{successMessage}</div>}
          <div className="text-center mb-5">
            <FaUserCircle className="text-secondary opacity-50 mb-3" size={80} />
            <h4>{user.fullName}</h4>
            <span className="badge bg-primary-blue px-3 py-2 text-uppercase">
              {user.role}
            </span>
          </div>
          
          <Form>
            <Form.Group className="mb-4" controlId="fullName">
              <Form.Label className="fw-medium text-muted">Full Name</Form.Label>
              <Form.Control 
                type="text" 
                value={user.fullName} 
                readOnly 
                className="bg-light"
              />
            </Form.Group>

            <Form.Group className="mb-4" controlId="email">
              <Form.Label className="fw-medium text-muted">Email Address</Form.Label>
              <Form.Control 
                type="email" 
                value={user.email} 
                readOnly 
                className="bg-light"
              />
            </Form.Group>

            <Form.Group className="mb-4" controlId="role">
              <Form.Label className="fw-medium text-muted">Account Role</Form.Label>
              <Form.Control 
                type="text" 
                value="Department Staff" 
                readOnly 
                className="bg-light"
              />
            </Form.Group>

            {user.department && (
              <Form.Group className="mb-4" controlId="department">
                <Form.Label className="fw-medium text-muted">Department</Form.Label>
                <Form.Control 
                  type="text" 
                  value={user.department} 
                  readOnly 
                  className="bg-light"
                />
              </Form.Group>
            )}
          </Form>
        </Card.Body>
      </Card>
    </Container>
  );
};

export default Profile;
