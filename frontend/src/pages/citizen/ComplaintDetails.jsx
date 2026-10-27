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
  FaHistory,
  FaStar,
  FaClock,
  FaPaperPlane
} from 'react-icons/fa';
import { api } from '../../services/api';
import LocationDisplay from '../../components/common/LocationDisplay';

const ComplaintDetails = () => {
  const { id } = useParams();
  const [complaint, setComplaint] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  // Citizen optional feedback state
  const [feedbackRating, setFeedbackRating] = useState(0);
  const [hoverRating, setHoverRating] = useState(0);
  const [feedbackComment, setFeedbackComment] = useState('');
  const [feedbackSubmitting, setFeedbackSubmitting] = useState(false);
  const [feedbackSuccess, setFeedbackSuccess] = useState('');
  const [feedbackError, setFeedbackError] = useState('');

  const fetchComplaint = async () => {
    try {
      setLoading(true);
      const data = await api.getComplaintDetails(id);
      setComplaint(data);
      if (data.feedback) {
        setFeedbackRating(data.feedback.rating || 0);
        setFeedbackComment(data.feedback.comment || '');
      }
    } catch (err) {
      setError('Complaint not found or you do not have permission to view it.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchComplaint();
  }, [id]);

  const handleSubmitFeedback = async (e) => {
    e.preventDefault();
    setFeedbackSubmitting(true);
    setFeedbackError('');
    setFeedbackSuccess('');

    try {
      const payload = {
        rating: feedbackRating > 0 ? feedbackRating : null,
        comment: feedbackComment.trim() || ''
      };
      const res = await api.submitFeedback(id, payload);
      setFeedbackSuccess(res.message || 'Thank you! Your feedback has been recorded.');
      const refreshed = await api.getComplaintDetails(id);
      setComplaint(refreshed);
    } catch (err) {
      setFeedbackError(err.message || 'Failed to submit feedback.');
    } finally {
      setFeedbackSubmitting(false);
    }
  };



  const getStatusBadge = (status) => {
    switch(status) {
      case 'Pending': return <Badge bg="warning" text="dark">Pending</Badge>;
      case 'In Progress': return <Badge bg="info">In Progress</Badge>;
      case 'Awaiting Authority Verification':
      case 'Awaiting Citizen Confirmation': return <Badge bg="primary">Awaiting Authority Verification</Badge>;
      case 'Resolved': return <Badge bg="success">Resolved</Badge>;
      case 'Rejected': return <Badge bg="danger">Rejected</Badge>;
      default: return <Badge bg="secondary">{status}</Badge>;
    }
  };

  const getTimelineDotColor = (status) => {
    switch (status) {
      case 'Resolved': return '#198754';
      case 'Awaiting Authority Verification':
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
  const isAwaitingVerification = complaint.status === 'Awaiting Authority Verification' || complaint.status === 'Awaiting Citizen Confirmation';
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



      {/* Awaiting Authority Verification Information Card */}
      {isAwaitingVerification && (
        <Card className="border-0 shadow-sm mb-4 bg-light overflow-hidden" style={{ borderLeft: '4px solid #8B5CF6' }}>
          <Card.Header className="py-3 px-4 d-flex justify-content-between align-items-center flex-wrap gap-2" style={{ backgroundColor: 'rgba(139, 92, 246, 0.12)' }}>
            <div className="d-flex align-items-center gap-2">
              <FaClock className="text-primary fs-5" />
              <h5 className="mb-0 fw-bold text-dark fs-6 fs-sm-5">
                Work Completed – Awaiting Authority Verification
              </h5>
            </div>
            <Badge bg="primary">Awaiting Verification</Badge>
          </Card.Header>
          <Card.Body className="p-3 p-sm-4">
            <p className="text-dark mb-2">
              The assigned department staff have finished the repair work and uploaded the completion report. It is currently awaiting verification and inspection by the Municipal Authority before being marked as Resolved.
            </p>
            {latestCompletion?.completion_remarks && (
              <div className="p-3 bg-white border rounded text-dark mt-3">
                <div className="d-flex justify-content-between align-items-center flex-wrap gap-1 mb-1">
                  <span className="fw-bold text-primary small">
                    <FaTools className="me-1" /> Reported by Staff: {latestCompletion.submitted_by_name || 'Department Staff'}
                  </span>
                  {latestCompletion.submitted_at_formatted && (
                    <small className="text-muted">{latestCompletion.submitted_at_formatted}</small>
                  )}
                </div>
                <strong>Completion Remarks:</strong> "{latestCompletion.completion_remarks}"
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
                Note: Municipal authority decisions are final.
              </small>
            </div>
          </div>
        </Alert>
      )}

      {/* Resolved Confirmation Banner */}
      {isResolved && (
        <Alert variant="success" className="mb-4 p-4 shadow-sm border-success">
          <div className="d-flex align-items-start">
            <FaCheckCircle className="fs-2 text-success me-3 mt-1 flex-shrink-0" />
            <div>
              <h5 className="alert-heading fw-bold mb-1">Issue Resolved & Approved</h5>
              <p className="mb-1 text-dark">
                This complaint has been inspected and approved by <strong>{complaint.verified_by_name || 'Municipal Authority'}</strong>
                {complaint.verified_at_formatted ? ` on ${complaint.verified_at_formatted}` : ''}.
              </p>
              {complaint.verification_remarks && (
                <div className="mt-2 p-2 bg-white rounded border border-success-subtle small text-dark">
                  <strong>Authority Remarks:</strong> "{complaint.verification_remarks}"
                </div>
              )}
              {latestCompletion?.completion_remarks && (
                <div className="mt-2 p-2 bg-white rounded border border-success-subtle small text-dark">
                  <strong>Work Done:</strong> "{latestCompletion.completion_remarks}"
                </div>
              )}
            </div>
          </div>
        </Alert>
      )}

      {/* Optional Citizen Feedback Card (When Complaint is Resolved) */}
      {isResolved && (
        <Card className="border-0 shadow-sm rounded-3 mb-4 overflow-hidden" style={{ borderLeft: '4px solid #F59E0B' }}>
          <Card.Header className="bg-white border-bottom py-3 px-4 d-flex justify-content-between align-items-center">
            <h5 className="mb-0 fw-bold text-dark d-flex align-items-center fs-6 fs-sm-5">
              <FaStar className="text-warning me-2" /> Citizen Feedback
            </h5>
            <span className="badge bg-light text-dark border fw-normal">Optional</span>
          </Card.Header>
          <Card.Body className="p-3 p-sm-4">
            <p className="text-muted small mb-3">
              Your complaint has been resolved. You can share your feedback and rate the service (1 to 5 stars).
              Feedback is completely optional and does not affect the complaint's resolution status.
            </p>

            {feedbackSuccess && (
              <Alert variant="success" dismissible onClose={() => setFeedbackSuccess('')} className="py-2 small">
                <FaCheckCircle className="me-2" /> {feedbackSuccess}
              </Alert>
            )}
            {feedbackError && (
              <Alert variant="danger" dismissible onClose={() => setFeedbackError('')} className="py-2 small">
                <FaExclamationCircle className="me-2" /> {feedbackError}
              </Alert>
            )}

            <Form onSubmit={handleSubmitFeedback}>
              {/* Star Rating 1-5 */}
              <Form.Group className="mb-3">
                <Form.Label className="fw-semibold text-dark small d-block mb-1">
                  Star Rating (Optional, 1–5 Stars):
                </Form.Label>
                <div className="d-flex align-items-center gap-2 flex-wrap">
                  <div className="d-flex align-items-center">
                    {[1, 2, 3, 4, 5].map((star) => {
                      const isFilled = (hoverRating || feedbackRating) >= star;
                      return (
                        <button
                          key={star}
                          type="button"
                          className="btn btn-link p-1 text-decoration-none"
                          style={{ cursor: 'pointer', lineHeight: 1 }}
                          onMouseEnter={() => setHoverRating(star)}
                          onMouseLeave={() => setHoverRating(0)}
                          onClick={() => setFeedbackRating(prev => prev === star ? 0 : star)}
                          title={`${star} Star${star > 1 ? 's' : ''}`}
                        >
                          <FaStar
                            size={26}
                            color={isFilled ? '#F59E0B' : '#D1D5DB'}
                            style={{ transition: 'color 0.15s ease-in-out' }}
                          />
                        </button>
                      );
                    })}
                  </div>
                  <span className="ms-1 fw-semibold text-muted small">
                    {feedbackRating > 0 ? `${feedbackRating} of 5 Stars` : 'Click stars to rate'}
                  </span>
                  {feedbackRating > 0 && (
                    <Button
                      variant="link"
                      size="sm"
                      className="text-muted p-0 ms-2 small text-decoration-none"
                      onClick={() => setFeedbackRating(0)}
                    >
                      Clear
                    </Button>
                  )}
                </div>
              </Form.Group>

              {/* Written Feedback / Comments */}
              <Form.Group className="mb-3">
                <Form.Label className="fw-semibold text-dark small">
                  Written Feedback / Comments (Optional)
                </Form.Label>
                <Form.Control
                  as="textarea"
                  rows={3}
                  placeholder="Share your thoughts on the resolution or suggestions for improvement..."
                  value={feedbackComment}
                  onChange={(e) => setFeedbackComment(e.target.value)}
                />
              </Form.Group>

              <div className="d-flex justify-content-start">
                <Button
                  variant="primary"
                  type="submit"
                  disabled={feedbackSubmitting}
                  className="fw-semibold px-4 py-2 d-inline-flex align-items-center"
                >
                  {feedbackSubmitting ? (
                    <>
                      <Spinner size="sm" className="me-2" /> Saving...
                    </>
                  ) : (
                    <>
                      <FaPaperPlane className="me-2" /> {complaint.feedback ? 'Update Feedback' : 'Submit Feedback'}
                    </>
                  )}
                </Button>
              </div>
            </Form>
          </Card.Body>
        </Card>
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
                <h5 className="border-bottom pb-2 mb-3 mb-sm-4">Photographic Evidence</h5>
                <Row className="g-3">
                  <Col md={complaint.completion_photo ? 6 : 12}>
                    <span className="fw-semibold text-dark small d-block mb-1">Original Issue Photo:</span>
                    {complaint.photo ? (
                      <img 
                        src={complaint.photo.startsWith('http') ? complaint.photo : `http://127.0.0.1:8000${complaint.photo}`} 
                        alt="Original Issue" 
                        className="img-fluid rounded border shadow-sm"
                        style={{ maxWidth: '100%', maxHeight: '280px', objectFit: 'contain' }}
                      />
                    ) : (
                      <div 
                        className="text-muted d-flex align-items-center justify-content-center border rounded bg-light"
                        style={{ maxWidth: '240px', width: '100%', height: '140px' }}
                      >
                        No photo available
                      </div>
                    )}
                  </Col>
                  {complaint.completion_photo && (
                    <Col md={6}>
                      <span className="fw-semibold text-dark small d-block mb-1">Work Completion Photo:</span>
                      <img 
                        src={complaint.completion_photo.startsWith('http') ? complaint.completion_photo : `http://127.0.0.1:8000${complaint.completion_photo}`} 
                        alt="Work Completion" 
                        className="img-fluid rounded border shadow-sm"
                        style={{ maxWidth: '100%', maxHeight: '280px', objectFit: 'contain' }}
                      />
                    </Col>
                  )}
                </Row>
              </div>

              {/* Work Completion History if multiple attempts exist */}
              {/* Work Completion & Municipal Authority Verification History */}
              {complaint.completions && complaint.completions.length > 0 && (
                <div className="mt-5">
                  <h5 className="border-bottom pb-2 mb-3">Work Completion & Municipal Verification History</h5>
                  <div className="d-flex flex-column gap-3">
                    {complaint.completions.map((comp, idx) => (
                      <div key={comp.id || idx} className="p-3 border rounded bg-light">
                        <div className="d-flex justify-content-between align-items-center mb-1 flex-wrap gap-1">
                          <span className="fw-bold text-dark">
                            Attempt #{complaint.completions.length - idx} &bull; {comp.submitted_by_name}
                          </span>
                          <small className="text-muted">{comp.submitted_at_formatted}</small>
                        </div>
                        <p className="mb-2 text-secondary small">
                          <strong>Staff Remarks:</strong> {comp.completion_remarks || 'Work completed.'}
                        </p>
                        <div className="d-flex align-items-center gap-2 flex-wrap">
                          <span className="small fw-semibold">Authority Verification:</span>
                          {comp.verification_status === 'Approved' && (
                            <Badge bg="success">
                              <FaCheckCircle className="me-1" /> Approved & Resolved
                            </Badge>
                          )}
                          {comp.verification_status === 'Rejected' && (
                            <Badge bg="danger">
                              <FaTimesCircle className="me-1" /> Rework Requested
                            </Badge>
                          )}
                          {(!comp.verification_status || comp.verification_status === 'Pending') && (
                            <Badge bg="primary">
                              <FaClock className="me-1" /> Awaiting Authority Verification
                            </Badge>
                          )}
                          {comp.verified_at_formatted && (
                            <small className="text-muted ms-1">
                              by {comp.verified_by_name || 'Municipal Authority'} on {comp.verified_at_formatted}
                            </small>
                          )}
                        </div>
                        {comp.verification_remarks && (
                          <div className="mt-2 text-dark small bg-white p-2 border rounded">
                            <strong>Authority Remarks:</strong> "{comp.verification_remarks}"
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
