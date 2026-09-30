import React, { useState, useEffect } from 'react';
import { Card, Form, Button, Spinner, Container, Alert } from 'react-bootstrap';
import { FaUserCircle } from 'react-icons/fa';
import { useNavigate } from 'react-router-dom';
import { api } from '../../services/api';

const EditProfile = () => {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({ fullName: '', email: '' });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        setLoading(true);
        const profileData = await api.getProfile();
        setFormData({
          fullName: profileData.fullName,
          email: profileData.email
        });
      } catch (err) {
        setError("Failed to load profile details.");
      } finally {
        setLoading(false);
      }
    };
    
    fetchProfile();
  }, []);

  const handleChange = (e) => {
    const { id, value } = e.target;
    setFormData(prev => ({ ...prev, [id]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (!formData.fullName.trim()) {
      setError('Full Name is required.');
      return;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(formData.email)) {
      setError('Please enter a valid email address.');
      return;
    }

    setSaving(true);
    try {
      await api.updateProfile({
        full_name: formData.fullName.trim(),
        email: formData.email.trim()
      });
      // Instead of relying solely on navigate state, we can just pass state to the Profile component
      // to display the success message.
      navigate('/dashboard/citizen/profile', { state: { successMessage: 'Profile updated successfully.' } });
    } catch (err) {
      setError(err.message || 'Failed to update profile.');
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="text-center py-5">
        <Spinner animation="border" variant="primary" />
      </div>
    );
  }

  return (
    <Container className="py-4" style={{ maxWidth: '700px', marginLeft: 0 }}>
      <h2 className="mb-4 text-dark fw-bold">Edit Profile</h2>
      
      <Card className="border-0 shadow-sm">
        <Card.Body className="p-4 p-md-5">
          {error && <Alert variant="danger">{error}</Alert>}

          <Form onSubmit={handleSubmit}>
            <Form.Group className="mb-4" controlId="fullName">
              <Form.Label className="fw-medium text-dark">Full Name <span className="text-danger">*</span></Form.Label>
              <Form.Control 
                type="text" 
                value={formData.fullName}
                onChange={handleChange}
                placeholder="Enter your full name"
                disabled={saving}
              />
            </Form.Group>

            <Form.Group className="mb-5" controlId="email">
              <Form.Label className="fw-medium text-dark">Email Address <span className="text-danger">*</span></Form.Label>
              <Form.Control 
                type="email" 
                value={formData.email}
                onChange={handleChange}
                placeholder="Enter your email address"
                disabled={saving}
              />
            </Form.Group>

            <div className="d-flex gap-3">
              <Button 
                variant="primary-blue" 
                type="submit" 
                className="px-4 py-2"
                disabled={saving}
              >
                {saving ? (
                  <><Spinner as="span" animation="border" size="sm" role="status" aria-hidden="true" className="me-2" /> Saving...</>
                ) : (
                  'Save Changes'
                )}
              </Button>
              <Button 
                variant="outline-secondary" 
                className="px-4 py-2"
                onClick={() => navigate('/dashboard/citizen/profile')}
                disabled={saving}
              >
                Cancel
              </Button>
            </div>
          </Form>
        </Card.Body>
      </Card>
    </Container>
  );
};

export default EditProfile;
