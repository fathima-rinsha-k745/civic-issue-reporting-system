import React, { useState, useEffect } from 'react';
import { Card, Badge, Spinner, Row, Col, Button, Alert, Form } from 'react-bootstrap';
import { useParams, Link } from 'react-router-dom';
import { 
  FaArrowLeft, 
  FaCalendarAlt, 
  FaBuilding, 
  FaCheckCircle, 
  FaTimesCircle, 
  FaExclamationCircle, 
  FaUserCheck, 
  FaTools, 
  FaBan,
  FaHistory
} from 'react-icons/fa';
import { api } from '../../services/api';
import LocationDisplay from '../../components/common/LocationDisplay';

const ComplaintDetails = () => {
  const { id } = useParams();
  const [complaint, setComplaint] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [actionLoading, setActionLoading] = useState(false);
  const [actionSuccess, setActionSuccess] = useState('');
  const [actionError, setActionError] = useState('');
  
  // Rejection reason form state
  const [showRejectForm, setShowRejectForm] = useState(false);
  const [rejectReason, setRejectReason] = useState('');

  const fetchComplaint = async () => {
    try {
      setLoading(true);
      const data = await api.getComplaintDetails(id);
      setComplaint(data);
    } catch (err) {
      setError('Complaint not found or you do not have permission to view it.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchComplaint();
  }, [id]);

  const handleConfirmResolution = async () => {
    try {
      setActionLoading(true);
      setActionError('');
      const updated = await api.citizenConfirmResolution(id);
      setActionSuccess('Thank you! You have confirmed that this issue is resolved.');
      setComplaint(updated);
      setShowRejectForm(false);
    } catch (err) {
      setActionError(err.message || 'Failed to confirm resolution. Please try again.');
    } finally {
      setActionLoading(false);
    }
  };

  const handleRejectResolution = async (e) => {
    e.preventDefault();
    if (!rejectReason.trim()) {
      setActionError('Please explain why the issue is not resolved.');
      return;
    }

    try {
      setActionLoading(true);
      setActionError('');
      const updated = await api.citizenRejectResolution(id, { remarks: rejectReason });
      setActionSuccess('Your feedback has been submitted. The complaint has been reopened as In Progress.');
      setComplaint(updated);
      setShowRejectForm(false);
      setRejectReason('');
    } catch (err) {
      setActionError(err.message || 'Failed to submit feedback. Please try again.');
    } finally {
      setActionLoading(false);
    }
  };

  const getStatusBadge = (status) => {
    switch(status) {
      case 'Pending': return <Badge bg="warning" text="dark">Pending</Badge>;
      case 'In Progress': return <Badge bg="info">In Progress</Badge>;
      case 'Awaiting Citizen Confirmation': return <Badge bg="primary">Awaiting Citizen Confirmation</Badge>;
      case 'Resolved': return <Badge bg="success">Resolved</Badge>;
      case 'Rejected': return <Badge bg="danger">Rejected</Badge>;
      default: return <Badge bg="secondary">{status}</Badge>;
    }
  };

  const getTimelineDotColor = (status) => {
    switch (status) {
      case 'Resolved': return '#198754';
      case 'Awaiting Citizen Confirmation': return '#6f42c1';
      case 'In Progress': return '#0d6efd';
      case 'Rejected': return '#dc3545';
      default: return '#ffc107';
    }
  };

  if (loading) {
    return (
      <div className="text-center py-5">
        <Spinner animation="border" variant="primary" />
      </div>
    );
  }

  if (error || !complaint) {
    return (
      <div className="text-center py-5">
        <h4 className="text-danger mb-3">{error || 'Complaint not found'}</h4>
        <Button as={Link} to="/dashboard/citizen/complaints" variant="outline-blue">
          Back to My Complaints
        </Button>
      </div>
    );
  }

  const latestCompletion = complaint.latest_completion;
  const isAwaitingConfirmation = complaint.status === 'Awaiting Citizen Confirmation';
  const isResolved = complaint.status === 'Resolved';
  const isRejected = complaint.status === 'Rejected';

  return (
    <div>
      <div className="mb-4">
        <Button 
          as={Link} 
          to="/dashboard/citizen/complaints" 
          variant="link" 
          className="text-decoration-none text-muted px-0 mb-2 d-inline-flex align-items-center"
        >
          <FaArrowLeft className="me-2" /> Back to list
        </Button>
        <div className="d-flex justify-content-between align-items-center flex-wrap gap-2">
          <div>
            <h2 className="mb-1 text-white fw-bold fs-3 fs-sm-2">Complaint Details #{complaint.id}</h2>
            <p className="text-secondary mb-0">View timeline, assigned department updates, and resolution status.</p>
          </div>
          <div>{getStatusBadge(complaint.status)}</div>
        </div>
      </div>

      {actionSuccess && (
        <Alert variant="success" dismissible onClose={() => setActionSuccess('')} className="mb-4">
          <FaCheckCircle className="me-2" />
          {actionSuccess}
        </Alert>
      )}

      {actionError && (
        <Alert variant="danger" dismissible onClose={() => setActionError('')} className="mb-4">
          <FaExclamationCircle className="me-2" />
          {actionError}
        </Alert>
      )}

      {/* Citizen Confirmation Request Card */}
      {isAwaitingConfirmation && (
        <Card className="border-primary shadow-sm mb-4 bg-light">
          <Card.Header className="bg-primary text-white py-3">
            <h5 className="mb-0 d-flex align-items-center fs-6 fs-sm-5">
              <FaUserCheck className="me-2" />
              Please Confirm Your Complaint Resolution
            </h5>
          </Card.Header>
          <Card.Body className="p-3 p-sm-4">
            <p className="lead text-dark fs-6 mb-3">
              The department staff have reported that work on your complaint has been completed. 
              Please review the completion remarks and confirm whether the issue has actually been fixed.
            </p>

            {latestCompletion && (
              <div className="p-3 bg-white border rounded mb-4">
                <div className="d-flex justify-content-between align-items-center flex-wrap mb-2 gap-1">
                  <span className="fw-bold text-primary small">
                    <FaTools className="me-1" /> Reported by Staff: {latestCompletion.submitted_by_name}
                  </span>
                  {latestCompletion.submitted_at_formatted && (
                    <small className="text-muted">{latestCompletion.submitted_at_formatted}</small>
                  )}
                </div>
                <div className="text-dark bg-light p-3 rounded border">
                  <strong>Completion Remarks:</strong>
                  <p className="mb-0 mt-1" style={{ whiteSpace: 'pre-wrap' }}>
                    {latestCompletion.completion_remarks || 'Work completed.'}
                  </p>
                </div>
              </div>
            )}

            {!showRejectForm ? (
              <div className="d-flex flex-column flex-sm-row gap-2 gap-sm-3">
                <Button 
                  variant="success" 
                  size="lg"
                  className="px-4 d-inline-flex align-items-center justify-content-center w-100 w-sm-auto"
                  onClick={handleConfirmResolution}
                  disabled={actionLoading}
                >
                  {actionLoading ? (
                    <Spinner size="sm" animation="border" className="me-2" />
                  ) : (
                    <FaCheckCircle className="me-2" />
                  )}
                  Yes, Resolved
                </Button>

                <Button 
                  variant="outline-danger" 
                  size="lg"
                  className="px-4 d-inline-flex align-items-center justify-content-center w-100 w-sm-auto"
                  onClick={() => setShowRejectForm(true)}
                  disabled={actionLoading}
                >
                  <FaTimesCircle className="me-2" />
                  No, Not Fixed
                </Button>
              </div>
            ) : (
              <div className="mt-3 p-3 bg-white border rounded border-danger">
                <h6 className="text-danger fw-bold mb-2">
                  <FaExclamationCircle className="me-2" />
                  Please explain why the issue is not fixed
                </h6>
                <Form onSubmit={handleRejectResolution}>
                  <Form.Group className="mb-3">
                    <Form.Control
                      as="textarea"
                      rows={3}
                      placeholder="Describe what is still not resolved or why additional work is needed..."
                      value={rejectReason}
                      onChange={(e) => setRejectReason(e.target.value)}
                      required
                    />
                  </Form.Group>
                  <div className="d-flex flex-column flex-sm-row gap-2">
                    <Button 
                      variant="danger" 
                      type="submit" 
                      disabled={actionLoading || !rejectReason.trim()}
                      className="d-inline-flex align-items-center justify-content-center w-100 w-sm-auto"
                    >
                      {actionLoading && <Spinner size="sm" animation="border" className="me-2" />}
                      Submit Feedback & Reopen
                    </Button>
                    <Button 
                      variant="secondary" 
                      onClick={() => setShowRejectForm(false)}
                      disabled={actionLoading}
                      className="w-100 w-sm-auto"
                    >
                      Cancel
                    </Button>
                  </div>
                </Form>
              </div>
            )}
          </Card.Body>
        </Card>
      )}

      {/* Rejection Alert Banner */}
      {isRejected && (
        <Alert variant="danger" className="mb-4 p-4 shadow-sm border-danger">
          <div className="d-flex align-items-start">
            <FaBan className="fs-2 text-danger me-3 mt-1 flex-shrink-0" />
            <div>
              <h5 className="alert-heading fw-bold mb-1">Complaint Rejected</h5>
              <p className="mb-1 text-dark">
                This complaint was rejected by <strong>{complaint.rejected_by_name || 'Municipal Authority'}</strong>
                {complaint.rejected_at_formatted ? ` on ${complaint.rejected_at_formatted}` : ''}.
              </p>
              <div className="mt-2 p-3 bg-white rounded border border-danger-subtle text-dark">
                <strong className="d-block mb-1 text-danger">Rejection Reason:</strong>
                <span>{complaint.rejection_reason || 'No specific reason provided.'}</span>
              </div>
              <small className="text-muted mt-2 d-block fst-italic">
                Note: Municipal authority decisions are final and cannot be modified.
              </small>
            </div>
          </div>
        </Alert>
      )}

      {/* Resolved Confirmation Banner */}
      {isResolved && (
        <Alert variant="success" className="mb-4 p-4 shadow-sm">
          <div className="d-flex align-items-start">
            <FaCheckCircle className="fs-2 text-success me-3 mt-1" />
            <div>
              <h5 className="alert-heading fw-bold mb-1">Issue Resolved and Confirmed</h5>
              <p className="mb-1 text-muted">
                This complaint was marked resolved following citizen confirmation.
              </p>
              {latestCompletion?.responded_at_formatted ? (
                <div className="small text-secondary mt-1">
                  <strong>Citizen Confirmation Date:</strong> {latestCompletion.responded_at_formatted}
                </div>
              ) : complaint.lastUpdated ? (
                <div className="small text-secondary mt-1">
                  <strong>Resolution Date:</strong> {complaint.lastUpdated}
                </div>
              ) : null}
              {latestCompletion?.completion_remarks && (
                <div className="mt-2 p-2 bg-white rounded border border-success-subtle small">
                  <strong>Final Completion Remarks:</strong> {latestCompletion.completion_remarks}
                </div>
              )}
            </div>
          </div>
        </Alert>
      )}

      <Row className="g-4">
        {/* Main Details */}
        <Col lg={8}>
          <Card className="border-0 shadow-sm h-100">
            <Card.Body className="p-3 p-sm-4 p-md-5">
              <h5 className="border-bottom pb-2 mb-4">Description</h5>
              <p className="mb-4 mb-sm-5" style={{ whiteSpace: 'pre-wrap' }}>
                {complaint.description}
              </p>

              <h5 className="border-bottom pb-2 mb-4">Details</h5>
              <Row className="g-3 g-sm-4">
                <Col sm={12}>
                  <LocationDisplay 
                    location={complaint.location} 
                    latitude={complaint.latitude} 
                    longitude={complaint.longitude} 
                  />
                </Col>

                <Col sm={6}>
                  <div className="d-flex align-items-start text-muted">
                    <FaBuilding className="mt-1 me-3 fs-5 text-primary-blue" />
                    <div>
                      <small className="d-block text-uppercase fw-bold">Assigned Department</small>
                      <span className="text-dark">{complaint.department || 'Unassigned'}</span>
                    </div>
                  </div>
                </Col>

                <Col sm={6}>
                  <div className="d-flex align-items-start text-muted">
                    <FaUserCheck className="mt-1 me-3 fs-5 text-primary-blue" />
                    <div>
                      <small className="d-block text-uppercase fw-bold">Assigned Staff</small>
                      <span className="text-dark">
                        {complaint.assigned_staff_members && complaint.assigned_staff_members.length > 0
                          ? complaint.assigned_staff_members.map(s => s.staff_name || s.name || s.staff_email).join(', ')
                          : 'Pending Staff Allocation'}
                      </span>
                    </div>
                  </div>
                </Col>

                <Col sm={6}>
                  <div className="d-flex align-items-start text-muted">
                    <FaCalendarAlt className="mt-1 me-3 fs-5 text-primary-blue" />
                    <div>
                      <small className="d-block text-uppercase fw-bold">Submitted Date</small>
                      <span className="text-dark">{complaint.submittedDate}</span>
                    </div>
                  </div>
                </Col>
              </Row>

              <div className="mt-4 mt-sm-5">
                <h5 className="border-bottom pb-2 mb-3 mb-sm-4">Photo</h5>
                {complaint.photo ? (
                  <img 
                    src={complaint.photo.startsWith('http') ? complaint.photo : `http://127.0.0.1:8000${complaint.photo}`} 
                    alt="Issue" 
                    className="img-fluid rounded border shadow-sm"
                    style={{ maxWidth: '100%', maxHeight: '300px', objectFit: 'cover' }}
                  />
                ) : (
                  <div 
                    className="text-muted d-flex align-items-center justify-content-center border rounded bg-light"
                    style={{ maxWidth: '240px', width: '100%', height: '140px' }}
                  >
                    No photo available
                  </div>
                )}
              </div>

              {/* Work Completion History if multiple attempts exist */}
              {complaint.completions && complaint.completions.length > 0 && (
                <div className="mt-5">
                  <h5 className="border-bottom pb-2 mb-3">Work Completion & Citizen Verification History</h5>
                  <div className="d-flex flex-column gap-3">
                    {complaint.completions.map((comp, idx) => (
                      <div key={comp.id || idx} className="p-3 border rounded bg-light">
                        <div className="d-flex justify-content-between align-items-center mb-1">
                          <span className="fw-bold text-dark">
                            Attempt #{complaint.completions.length - idx} &bull; {comp.submitted_by_name}
                          </span>
                          <small className="text-muted">{comp.submitted_at_formatted}</small>
                        </div>
                        <p className="mb-2 text-secondary small">
                          <strong>Remarks:</strong> {comp.completion_remarks}
                        </p>
                        <div className="d-flex align-items-center gap-2">
                          <span className="small fw-semibold">Citizen Response:</span>
                          {comp.citizen_response === 'Confirmed' && (
                            <Badge bg="success">Confirmed Fixed</Badge>
                          )}
                          {comp.citizen_response === 'Disputed' && (
                            <Badge bg="danger">Reported Not Fixed</Badge>
                          )}
                          {comp.citizen_response === 'Pending' && (
                            <Badge bg="warning" text="dark">Pending Confirmation</Badge>
                          )}
                          {comp.responded_at_formatted && (
                            <small className="text-muted ms-2">on {comp.responded_at_formatted}</small>
                          )}
                        </div>
                        {comp.citizen_remarks && (
                          <div className="mt-2 text-danger small bg-white p-2 border rounded">
                            <strong>Citizen Reason:</strong> {comp.citizen_remarks}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </Card.Body>
          </Card>
        </Col>

        {/* Complaint Timeline */}
        <Col lg={4}>
          <Card className="border-0 shadow-sm h-100 bg-light-blue">
            <Card.Body className="p-4">
              <h5 className="mb-4 fw-bold d-flex align-items-center text-dark">
                <FaHistory className="me-2 text-primary" /> Complaint Timeline
              </h5>
              
              <div className="timeline">
                {complaint.history && complaint.history.map((item, index) => {
                  const dotColor = getTimelineDotColor(item.status);
                  return (
                    <div key={index} className="timeline-item position-relative ps-4 pb-4">
                      {/* Timeline Line */}
                      {index !== complaint.history.length - 1 && (
                        <div 
                          className="position-absolute bg-primary-blue" 
                          style={{ left: '6px', top: '24px', bottom: 0, width: '2px', opacity: 0.2 }}
                        ></div>
                      )}
                      
                      {/* Timeline Dot */}
                      <div 
                        className="position-absolute rounded-circle" 
                        style={{ left: 0, top: '4px', width: '14px', height: '14px', backgroundColor: dotColor }}
                      ></div>
                      
                      {/* Content */}
                      <div>
                        <div className="d-flex justify-content-between align-items-start mb-1 flex-wrap gap-1">
                          <span className="fw-bold text-dark">{item.action_label || item.status}</span>
                          {item.updated_by_name && (
                            <span className="badge bg-white text-primary border shadow-none" style={{ fontSize: '0.75rem' }}>
                              By: {item.updated_by_name}
                            </span>
                          )}
                        </div>
                        <p className="text-muted small mb-1">{item.remarks}</p>
                        <small className="text-secondary" style={{ fontSize: '0.75rem' }}>
                          {item.updated_at ? new Date(item.updated_at).toLocaleString() : item.date}
                        </small>
                      </div>
                    </div>
                  );
                })}
              </div>
            </Card.Body>
          </Card>
        </Col>
      </Row>
    </div>
  );
};

export default ComplaintDetails;
