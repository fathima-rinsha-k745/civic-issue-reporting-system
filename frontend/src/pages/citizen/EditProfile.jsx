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
    <Container className="py-2 px-0 px-sm-2" style={{ maxWidth: '700px', marginLeft: 0 }}>
      <div className="mb-4">
        <h2 className="mb-1 text-white fw-bold fs-3 fs-sm-2">Edit Profile</h2>
        <p className="text-secondary mb-0">Update your personal details and contact information.</p>
      </div>
      
      <Card className="border-0 shadow-sm">
        <Card.Body className="p-3 p-sm-4 p-md-5">
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

            <Form.Group className="mb-4 mb-sm-5" controlId="email">
              <Form.Label className="fw-medium text-dark">Email Address <span className="text-danger">*</span></Form.Label>
              <Form.Control 
                type="email" 
                value={formData.email}
                onChange={handleChange}
                placeholder="Enter your email address"
                disabled={saving}
              />
            </Form.Group>

            <div className="d-flex flex-column flex-sm-row gap-2 gap-sm-3">
              <Button 
                variant="primary-blue" 
                type="submit" 
                className="px-4 py-2 w-100 w-sm-auto d-inline-flex align-items-center justify-content-center"
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
                className="px-4 py-2 w-100 w-sm-auto"
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
