import React, { useState, useEffect } from 'react';
import { Card, Badge, Spinner, Button, Row, Col, Form, Alert } from 'react-bootstrap';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { api } from '../../services/api';
import { FaArrowLeft } from 'react-icons/fa';

const ComplaintDetails = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [complaint, setComplaint] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  
  const [status, setStatus] = useState('');
  const [remarks, setRemarks] = useState('');

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const data = await api.getComplaintDetails(id);
        setComplaint(data);
        setStatus(data.status);
      } catch (err) {
        setError('Failed to load complaint details.');
      } finally {
        setLoading(false);
      }
    };
    
    fetchData();
  }, [id]);

  const handleUpdate = async (e) => {
    e.preventDefault();
    if (!status || !remarks.trim()) {
      setError('Both status and remarks are required.');
      return;
    }
    
    setSaving(true);
    setError('');
    setSuccess('');
    
    try {
      const updated = await api.updateComplaint(id, {
         status: status,
         remarks: remarks.trim()
      });
      setComplaint(updated);
      setRemarks('');
      setSuccess('Complaint status updated successfully.');
    } catch (err) {
      setError(err.message || 'Failed to update complaint.');
    } finally {
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

  if (!complaint) {
    return (
      <div>
        <Alert variant="danger">{error || 'Complaint not found.'}</Alert>
        <Button variant="secondary" onClick={() => navigate(-1)}>Back</Button>
      </div>
    );
  }

  return (
    <div className="mx-auto" style={{ maxWidth: '1000px' }}>
      <div className="mb-4">
        <Button 
          as={Link} 
          to="/dashboard/department_staff" 
          variant="link" 
          className="text-decoration-none text-muted px-0 mb-2 d-inline-flex align-items-center"
        >
          <FaArrowLeft className="me-2" /> Back to list
        </Button>
        <h3 className="fw-bold mb-1 text-dark">Update Complaint Status</h3>
        <p className="text-muted fs-6">Update the progress of this assigned task.</p>
      </div>

      {error && <Alert variant="danger">{error}</Alert>}
      {success && <Alert variant="success">{success}</Alert>}

      <Card className="border-0 shadow-sm rounded-3 overflow-hidden mb-4">
        <Card.Body className="p-0">
          <Row className="g-0">
            {/* Left side: Photo */}
            <Col md={5} className="bg-light p-4 d-flex align-items-center justify-content-center border-end">
              {complaint.photo ? (
                <img 
                  src={complaint.photo.startsWith('http') ? complaint.photo : `http://127.0.0.1:8000${complaint.photo}`} 
                  alt="Complaint Evidence" 
                  className="img-fluid rounded shadow-sm"
                  style={{ width: '100%', maxHeight: '400px', objectFit: 'contain' }}
                />
              ) : (
                <div className="text-muted text-center p-5 border rounded bg-white w-100 d-flex align-items-center justify-content-center" style={{ minHeight: '300px' }}>
                  No photo uploaded
                </div>
              )}
            </Col>
            
            {/* Right side: Details & Form */}
            <Col md={7} className="p-4 p-md-5 d-flex flex-column">
              <div className="mb-4">
                <Row className="mb-3">
                  <Col sm={4} className="text-muted fw-semibold">Complaint ID</Col>
                  <Col sm={8} className="fw-bold text-dark">: {complaint.id || `C0${complaint.id}`}</Col>
                </Row>
                <Row className="mb-3">
                  <Col sm={4} className="text-muted fw-semibold">Description</Col>
                  <Col sm={8} className="text-dark">: {complaint.description}</Col>
                </Row>
                <Row className="mb-3">
                  <Col sm={4} className="text-muted fw-semibold">Location</Col>
                  <Col sm={8} className="text-dark">: {complaint.location}</Col>
                </Row>
                <Row className="mb-3">
                  <Col sm={4} className="text-muted fw-semibold">Status</Col>
                  <Col sm={8}>
                    : <span className="ms-1 px-3 py-1 rounded-pill" style={{
                          backgroundColor: complaint.status === 'Resolved' ? '#d1e7dd' : complaint.status === 'In Progress' ? '#cfe2ff' : complaint.status === 'Rejected' ? '#f8d7da' : '#fff3cd',
                          color: complaint.status === 'Resolved' ? '#0f5132' : complaint.status === 'In Progress' ? '#084298' : complaint.status === 'Rejected' ? '#842029' : '#856404',
                          fontSize: '0.9rem',
                          fontWeight: '500'
                      }}>
                      {complaint.status}
                    </span>
                  </Col>
                </Row>
              </div>

              <hr className="my-3 border-secondary opacity-25" />

              {/* Status Update Form */}
              <Form onSubmit={handleUpdate} className="mt-auto pt-3">
                <Form.Group className="mb-3">
                  <Form.Label className="fw-bold text-dark">Update Status *</Form.Label>
                  <Form.Select 
                    size="md"
                    value={status}
                    onChange={(e) => setStatus(e.target.value)}
                    className="shadow-none border-secondary"
                    required
                  >
                    <option value="In Progress">In Progress</option>
                    <option value="Resolved">Resolved</option>
                    <option value="Rejected">Rejected</option>
                  </Form.Select>
                </Form.Group>

                <Form.Group className="mb-4">
                  <Form.Label className="fw-bold text-dark">Progress Remarks *</Form.Label>
                  <Form.Control
                    as="textarea"
                    rows={3}
                    placeholder="Describe the actions taken..."
                    value={remarks}
                    onChange={(e) => setRemarks(e.target.value)}
                    required
                  />
                </Form.Group>

                <div className="d-flex gap-3">
                  <Button 
                    variant="primary" 
                    type="submit" 
                    disabled={saving}
                    className="px-4 fw-semibold"
                    style={{ backgroundColor: '#0d6efd', border: 'none', borderRadius: '6px' }}
                  >
                    {saving ? <Spinner size="sm" /> : 'Update Progress'}
                  </Button>
                </div>
              </Form>
            </Col>
          </Row>
        </Card.Body>
      </Card>
      
      {/* History Timeline */}
      <Card className="border-0 shadow-sm bg-light-blue mt-4">
        <Card.Body className="p-4">
          <h5 className="mb-4 fw-bold">Resolution History</h5>
          <div className="timeline">
            {complaint.history && complaint.history.map((item, index) => (
              <div key={index} className="timeline-item position-relative ps-4 pb-4">
                {index !== complaint.history.length - 1 && (
                  <div 
                    className="position-absolute bg-primary-blue" 
                    style={{ left: '6px', top: '24px', bottom: 0, width: '2px', opacity: 0.2 }}
                  ></div>
                )}
                <div 
                  className="position-absolute bg-primary-blue rounded-circle" 
                  style={{ left: 0, top: '4px', width: '14px', height: '14px' }}
                ></div>
                <div>
                  <div className="d-flex justify-content-between align-items-start mb-1">
                    <span className="fw-bold text-dark">{item.status}</span>
                  </div>
                  <p className="text-muted small mb-1">{item.remarks}</p>
                  <small className="text-secondary" style={{ fontSize: '0.75rem' }}>{item.date}</small>
                </div>
              </div>
            ))}
          </div>
        </Card.Body>
      </Card>
    </div>
  );
};

export default ComplaintDetails;
