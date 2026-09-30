import React, { useState } from 'react';
import { Card, Form, Button, Alert, Spinner, Container } from 'react-bootstrap';
import { useNavigate } from 'react-router-dom';
import { api } from '../../services/api';

const SubmitComplaint = () => {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    description: '',
    location: '',
    photo: null
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [submittedComplaint, setSubmittedComplaint] = useState(null);

  const handleChange = (e) => {
    const { id, value } = e.target;
    setFormData(prev => ({ ...prev, [id]: value }));
  };

  const handleFileChange = (e) => {
    // In a real app, this would upload the file or create an object URL
    setFormData(prev => ({ ...prev, photo: e.target.files[0] }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    
    if (!formData.description.trim()) {
      setError('Description is required.');
      return;
    }
    
    if (!formData.location.trim()) {
      setError('Location is required.');
      return;
    }

    setLoading(true);

    try {
      const result = await api.submitComplaint(formData);
      setSubmittedComplaint(result);
      setSuccess(true);
    } catch (err) {
      setError('Failed to submit complaint. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  if (success && submittedComplaint) {
    return (
      <Container className="py-4" style={{ maxWidth: '600px' }}>
        <Card className="border-0 shadow-sm text-center py-5">
          <Card.Body>
            <div className="mb-4 text-success">
              <svg xmlns="http://www.w3.org/2000/svg" width="64" height="64" fill="currentColor" className="bi bi-check-circle-fill" viewBox="0 0 16 16">
                <path d="M16 8A8 8 0 1 1 0 8a8 8 0 0 1 16 0zm-3.97-3.03a.75.75 0 0 0-1.08.022L7.477 9.417 5.384 7.323a.75.75 0 0 0-1.06 1.06L6.97 11.03a.75.75 0 0 0 1.079-.02l3.992-4.99a.75.75 0 0 0-.01-1.05z"/>
              </svg>
            </div>
            <h3 className="mb-3">Complaint submitted successfully.</h3>
            <p className="text-muted mb-2">Complaint ID: <strong>{submittedComplaint.id}</strong></p>
            <p className="text-muted mb-4">Current Status: <strong className="text-warning">{submittedComplaint.status}</strong></p>
            
            <div className="d-flex justify-content-center gap-3">
              <Button onClick={() => {setSuccess(false); setFormData({description: '', location: '', photo: null})}} variant="outline-blue">
                Submit Another
              </Button>
              <Button onClick={() => navigate('/dashboard/citizen/complaints')} variant="primary-blue">
                Go to My Complaints
              </Button>
            </div>
          </Card.Body>
        </Card>
      </Container>
    );
  }

  return (
    <Container className="py-2" style={{ maxWidth: '800px', marginLeft: 0 }}>
      <h2 className="mb-4 text-dark fw-bold">Report a Civic Issue</h2>
      
      <Card className="border-0 shadow-sm">
        <Card.Body className="p-4 p-md-5">
          {error && <Alert variant="danger">{error}</Alert>}
          
          <Form onSubmit={handleSubmit}>
            <Form.Group className="mb-4" controlId="description">
              <Form.Label className="fw-medium">Description <span className="text-danger">*</span></Form.Label>
              <Form.Control 
                as="textarea" 
                rows={4}
                placeholder="Describe the issue in detail..." 
                value={formData.description}
                onChange={handleChange}
                disabled={loading}
              />
              <Form.Text className="text-muted">
                Please provide clear details so authorities can understand the problem.
              </Form.Text>
            </Form.Group>

            <Form.Group className="mb-4" controlId="location">
              <Form.Label className="fw-medium">Location <span className="text-danger">*</span></Form.Label>
              <Form.Control 
                type="text" 
                placeholder="Enter exact location or landmark..." 
                value={formData.location}
                onChange={handleChange}
                disabled={loading}
              />
            </Form.Group>

            <Form.Group className="mb-4" controlId="photo">
              <Form.Label className="fw-medium">Upload Photo <span className="text-muted fw-normal">(Optional)</span></Form.Label>
              <Form.Control 
                type="file" 
                accept="image/*"
                onChange={handleFileChange}
                disabled={loading}
              />
              <Form.Text className="text-muted">
                A picture helps authorities identify the issue faster.
              </Form.Text>
            </Form.Group>

            {/* Note: NO Category selection as requested */}
            <div className="alert alert-light border mb-4">
              <small className="text-muted">
                <i className="bi bi-info-circle me-1"></i>
                The Municipal Authority will review your submission and categorize it for the appropriate department.
              </small>
            </div>

            <Button 
              variant="primary-blue" 
              type="submit" 
              className="px-4 py-2"
              disabled={loading}
            >
              {loading ? (
                <><Spinner as="span" animation="border" size="sm" role="status" aria-hidden="true" className="me-2" /> Submitting...</>
              ) : (
                'Submit Complaint'
              )}
            </Button>
          </Form>
        </Card.Body>
      </Card>
    </Container>
  );
};

export default SubmitComplaint;
