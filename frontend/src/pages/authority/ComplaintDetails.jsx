import React, { useState, useEffect } from 'react';
import { Card, Badge, Spinner, Button, Row, Col, Form, Alert } from 'react-bootstrap';
import { useParams, useNavigate } from 'react-router-dom';
import { api } from '../../services/api';

const ComplaintDetails = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [complaint, setComplaint] = useState(null);
  const [departments, setDepartments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  
  const [selectedDepartment, setSelectedDepartment] = useState('');

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const [complaintData, deptsData] = await Promise.all([
          api.getComplaintDetails(id),
          api.getDepartments().catch(() => [])
        ]);
        setComplaint(complaintData);
        setDepartments(deptsData);
        setSelectedDepartment(complaintData.department_id || complaintData.department || '');
      } catch (err) {
        setError('Failed to load complaint details.');
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    
    fetchData();
  }, [id]);

  const handleUpdate = async (e) => {
    e.preventDefault();
    if (!selectedDepartment) {
      setError('Please select a department.');
      return;
    }
    
    setSaving(true);
    setError('');
    setSuccess('');
    
    try {
      let deptId = selectedDepartment;
      const dept = departments.find(d => String(d.id) === String(selectedDepartment) || d.name === selectedDepartment);
      if (dept) {
         deptId = dept.id;
      }
      
      const updated = await api.updateComplaint(id, {
         department: deptId,
         status: 'In Progress',
         remarks: `Assigned to ${dept ? dept.name : 'Department'}`
      });
      setComplaint(updated);
      setSuccess('Department assigned successfully.');
    } catch (err) {
      setError(err.message || 'Failed to assign department.');
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
        <h3 className="fw-bold mb-1 text-dark">Assign Department</h3>
        <p className="text-muted fs-6">Assign the complaint to the appropriate department.</p>
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
                          backgroundColor: complaint.status === 'Pending' ? '#fff3cd' : '#cfe2ff',
                          color: complaint.status === 'Pending' ? '#856404' : '#084298',
                          fontSize: '0.9rem',
                          fontWeight: '500'
                      }}>
                      {complaint.status}
                    </span>
                  </Col>
                </Row>
                <Row className="mb-3">
                  <Col sm={4} className="text-muted fw-semibold">Submitted On</Col>
                  <Col sm={8} className="text-dark">: {complaint.submittedDate}</Col>
                </Row>
              </div>

              <hr className="my-3 border-secondary opacity-25" />

              {/* Department Assignment Form */}
              <Form onSubmit={handleUpdate} className="mt-auto pt-3">
                <Form.Group className="mb-4">
                  <Form.Label className="fw-bold text-dark">Select Department *</Form.Label>
                  <Form.Select 
                    size="md"
                    value={selectedDepartment}
                    onChange={(e) => setSelectedDepartment(e.target.value)}
                    className="shadow-none border-secondary"
                    required
                  >
                    <option value="">-- Select Department --</option>
                    {departments.map(d => (
                      <option key={d.id} value={d.id}>{d.name}</option>
                    ))}
                  </Form.Select>
                </Form.Group>

                <div className="d-flex gap-3">
                  <Button 
                    variant="primary" 
                    type="submit" 
                    disabled={saving}
                    className="px-4 fw-semibold"
                    style={{ backgroundColor: '#0d6efd', border: 'none', borderRadius: '6px' }}
                  >
                    {saving ? <Spinner size="sm" /> : 'Assign Department'}
                  </Button>
                  <Button 
                    variant="outline-secondary" 
                    onClick={() => navigate('/dashboard/municipal_authority')}
                    className="px-4 fw-semibold"
                    style={{ borderRadius: '6px' }}
                  >
                    Cancel
                  </Button>
                </div>
              </Form>
            </Col>
          </Row>
        </Card.Body>
      </Card>
    </div>
  );
};

export default ComplaintDetails;
