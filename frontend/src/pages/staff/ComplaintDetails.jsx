import React, { useState, useEffect } from 'react';
import { Card, Badge, Spinner, Button, Row, Col, Form, Alert } from 'react-bootstrap';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { api } from '../../services/api';
import { 
  FaArrowLeft, 
  FaCheckCircle, 
  FaUsers, 
  FaClock, 
  FaExclamationTriangle, 
  FaHistory, 
  FaPaperPlane, 
  FaBuilding, 
  FaUser, 
  FaCalendarAlt, 
  FaTag,
  FaTools
} from 'react-icons/fa';
import LocationDisplay from '../../components/common/LocationDisplay';

const ComplaintDetails = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [complaint, setComplaint] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  
  const [completionRemarks, setCompletionRemarks] = useState('');
  const [startingWork, setStartingWork] = useState(false);

  useEffect(() => {
    let isMounted = true;
    const fetchData = async () => {
      try {
        setLoading(true);
        setError('');
        const data = await api.getComplaintDetails(id);
        if (isMounted) {
          setComplaint(data);
        }
      } catch (err) {
        if (isMounted) {
          setError(err.message || 'Failed to load complaint details.');
        }
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    };
    
    fetchData();
    return () => { isMounted = false; };
  }, [id]);

  const handleStartWork = async () => {
    setStartingWork(true);
    setError('');
    setSuccess('');

    try {
      const updated = await api.startWork(id);
      setComplaint(updated);
      setSuccess('Work started! Complaint status is now In Progress and the citizen has been notified.');
    } catch (err) {
      setError(err.message || 'Failed to start work on complaint.');
    } finally {
      setStartingWork(false);
    }
  };

  const handleSubmitCompletion = async (e) => {
    e.preventDefault();
    const trimmed = completionRemarks.trim();
    if (!trimmed) {
      setError('Please provide completion remarks describing the work completed.');
      return;
    }

    setSaving(true);
    setError('');
    setSuccess('');

    try {
      const updated = await api.submitCompletion(id, {
        completion_remarks: trimmed
      });
      setComplaint(updated);
      setCompletionRemarks('');
      setSuccess('Work completion submitted successfully! The citizen has been asked to confirm whether the issue has been resolved.');
    } catch (err) {
      setError(err.message || 'Failed to submit work completion.');
    } finally {
      setSaving(false);
    }
  };

  // Helper for consistent status badges
  const getStatusBadge = (status) => {
    const styles = {
      'Pending': { bg: '#FFF3CD', color: '#856404', border: '#FFE69C' },
      'In Progress': { bg: '#CFE2FF', color: '#084298', border: '#B6D4FE' },
      'Awaiting Citizen Confirmation': { bg: '#E2D9F3', color: '#59359A', border: '#D3C6ED' },
      'Resolved': { bg: '#D1E7DD', color: '#0F5132', border: '#BADBCC' },
      'Rejected': { bg: '#F8D7DA', color: '#842029', border: '#F5C2C7' }
    };

    const style = styles[status] || { bg: '#E9ECEF', color: '#495057', border: '#DEE2E6' };

    return (
      <span 
        className="px-3 py-1 rounded-pill fw-semibold text-nowrap d-inline-block"
        style={{
          backgroundColor: style.bg,
          color: style.color,
          border: `1px solid ${style.border}`,
          fontSize: '0.85rem'
        }}
      >
        {status}
      </span>
    );
  };

  // Helper for timeline dot color
  const getTimelineDotColor = (status) => {
    switch (status) {
      case 'Resolved': return '#198754';
      case 'Awaiting Citizen Confirmation': return '#6f42c1';
      case 'In Progress': return '#0d6efd';
      case 'Rejected': return '#dc3545';
      default: return '#ffc107';
    }
  };

  // Friendly actor name fallback
  const getActorDisplayName = (item) => {
    if (item.updated_by_name && !item.updated_by_name.includes('@') && item.updated_by_name !== 'System') {
      return item.updated_by_name;
    }
    if (item.updated_by_role === 'MUNICIPAL_AUTHORITY') {
      return 'Municipal Authority';
    }
    if (item.updated_by_role === 'DEPARTMENT_STAFF') {
      return 'Department Staff';
    }
    if (item.updated_by_role === 'CITIZEN') {
      if (complaint && complaint.citizen_name && !complaint.citizen_name.includes('@')) {
        return complaint.citizen_name;
      }
      return 'Citizen';
    }
    return 'System';
  };

  // Meaningful action header for timeline
  const getTimelineActionLabel = (item) => {
    const actor = getActorDisplayName(item);
    const remarks = (item.remarks || '').toLowerCase();

    // Assignment actions must ALWAYS be labelled as assigned by the actor
    if (remarks.includes('assigned') || item.updated_by_role === 'MUNICIPAL_AUTHORITY') {
      return `Assigned by ${actor}`;
    }
    if (item.status === 'Pending') {
      return `Submitted by ${actor}`;
    }
    if (item.status === 'Awaiting Citizen Confirmation') {
      return `Completion submitted by ${actor}`;
    }
    if (item.status === 'Resolved') {
      return item.updated_by_role === 'CITIZEN' ? `Confirmed by ${actor}` : `Resolved by ${actor}`;
    }
    if (remarks.includes('not fixed') || remarks.includes('reopen') || (item.updated_by_role === 'CITIZEN' && item.status === 'In Progress')) {
      return `Reopened by ${actor}`;
    }
    if (item.status === 'Rejected') {
      return `Rejected by ${actor}`;
    }
    if (item.action_label && !item.action_label.includes('@')) {
      return item.action_label;
    }
    return `Updated by ${actor}`;
  };

  // Short, clear event description based on actual database data
  const getTimelineEventDescription = (item) => {
    const rawRemarks = (item.remarks || '').trim();
    const lower = rawRemarks.toLowerCase();

    // Assignment actions must ALWAYS display the actual assignment remarks, never "confirmed by citizen"
    if (lower.includes('assigned') || item.updated_by_role === 'MUNICIPAL_AUTHORITY') {
      return rawRemarks || `Complaint assigned to ${complaint?.department || 'department'}.`;
    }

    if (item.status === 'Pending') {
      if (!rawRemarks || lower === 'complaint submitted' || lower.includes('automatically submitted') || lower.includes('complaint received')) {
        return 'Complaint submitted by the citizen.';
      }
      return rawRemarks;
    }

    if (item.status === 'In Progress') {
      if (lower.startsWith('assigned to')) {
        return rawRemarks;
      }
      return rawRemarks || 'Complaint status updated to In Progress.';
    }

    if (item.status === 'Awaiting Citizen Confirmation') {
      if (rawRemarks) {
        return `Work completion submitted: "${rawRemarks}"`;
      }
      return 'Work completion submitted. Waiting for citizen confirmation.';
    }

    if (item.status === 'Resolved') {
      if (lower.includes('citizen confirmed') || item.updated_by_role === 'CITIZEN') {
        return rawRemarks.length > 'citizen confirmed resolution.'.length ? rawRemarks : 'The citizen confirmed that the issue was resolved.';
      }
      return rawRemarks || 'The citizen confirmed that the issue was resolved.';
    }

    return rawRemarks || `Status updated to ${item.status}.`;
  };

  const formatDateTime = (dateStr) => {
    if (!dateStr) return '';
    try {
      const d = new Date(dateStr);
      if (isNaN(d.getTime())) return dateStr;
      return d.toLocaleString('en-US', {
        day: 'numeric',
        month: 'short',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
        hour12: true
      });
    } catch (e) {
      return dateStr;
    }
  };

  if (loading) {
    return (
      <div className="text-center py-5">
        <Spinner animation="border" variant="primary" />
        <div className="text-muted mt-2">Loading complaint details...</div>
      </div>
    );
  }

  if (!complaint) {
    return (
      <div className="mx-auto py-4" style={{ maxWidth: '960px' }}>
        <Alert variant="danger" className="d-flex align-items-center mb-4">
          <FaExclamationTriangle className="me-2 fs-5 flex-shrink-0" />
          <div>{error || `Complaint #${id} could not be found or you do not have permission to view it.`}</div>
        </Alert>
        <Button 
          as={Link} 
          to="/dashboard/department_staff" 
          variant="primary"
          className="d-inline-flex align-items-center"
        >
          <FaArrowLeft className="me-2" /> Back to Assigned Complaints
        </Button>
      </div>
    );
  }

  const isPending = complaint.status === 'Pending';
  const isInProgress = complaint.status === 'In Progress';
  const isCompletedAwaiting = complaint.status === 'Awaiting Citizen Confirmation';
  const isResolved = complaint.status === 'Resolved';
  const isRejected = complaint.status === 'Rejected';
  const timelineHistory = complaint.history || complaint.status_history || [];

  return (
    <div className="mx-auto" style={{ maxWidth: '960px' }}>
      {/* Navigation & Header */}
      <div className="mb-4">
        <Button 
          as={Link} 
          to="/dashboard/department_staff" 
          variant="link" 
          className="text-decoration-none text-muted px-0 mb-2 d-inline-flex align-items-center fw-medium"
        >
          <FaArrowLeft className="me-2" /> Back to Assigned Complaints
        </Button>
        <div className="d-flex justify-content-between align-items-center flex-wrap gap-2">
          <div>
            <h3 className="fw-bold mb-1 text-dark fs-3 fs-sm-2">Complaint Task Details</h3>
            <p className="text-muted fs-6 mb-0">Review task details and submit work completion for citizen verification.</p>
          </div>
          <div>{getStatusBadge(complaint.status)}</div>
        </div>
      </div>

      {error && <Alert variant="danger" dismissible onClose={() => setError('')} className="mb-4">{error}</Alert>}
      {success && <Alert variant="success" dismissible onClose={() => setSuccess('')} className="mb-4">{success}</Alert>}

      {/* 1. Complaint Details Card (No photographic evidence section as requested) */}
      <Card className="border-0 shadow-sm rounded-3 mb-4 overflow-hidden">
        <Card.Header className="bg-white border-bottom py-3 px-3 px-sm-4 d-flex justify-content-between align-items-center flex-wrap gap-2">
          <div className="d-flex align-items-center gap-2">
            <span className="fw-bold text-dark fs-5">Complaint #{complaint.id}</span>
            <Badge bg="light" text="dark" className="border fw-normal px-2 py-1">
              <FaTag className="me-1 text-secondary" /> {complaint.category || 'General'}
            </Badge>
          </div>
          <span className="text-muted small">
            Submitted: {complaint.submittedDate || 'N/A'}
          </span>
        </Card.Header>
        <Card.Body className="p-3 p-sm-4">
          <Row className="g-3">
            <Col md={6}>
              <div className="d-flex align-items-center mb-2">
                <FaUser className="me-2 text-secondary" />
                <span className="text-muted fw-semibold small me-2">Citizen:</span>
                <span className="text-dark fw-medium">{complaint.citizen_name || 'Citizen'}</span>
              </div>
            </Col>
            <Col md={6}>
              <div className="d-flex align-items-center mb-2">
                <FaBuilding className="me-2 text-secondary" />
                <span className="text-muted fw-semibold small me-2">Department:</span>
                <span className="text-dark fw-medium">{complaint.department || 'Unassigned'}</span>
              </div>
            </Col>
            <Col md={6}>
              <div className="d-flex align-items-center mb-2">
                <FaUsers className="me-2 text-primary" />
                <span className="text-muted fw-semibold small me-2">Assigned Staff:</span>
                <div>
                  {complaint.assigned_staff_members && complaint.assigned_staff_members.length > 0 ? (
                    <div className="d-inline-flex flex-wrap gap-1 align-items-center">
                      {complaint.assigned_staff_members.map(s => (
                        <Badge key={s.id} bg="primary" className="fw-normal px-2 py-1">
                          {s.staff_name || s.name || s.staff_email}
                        </Badge>
                      ))}
                    </div>
                  ) : (
                    <span className="text-muted small">Assigned to Department Team</span>
                  )}
                </div>
              </div>
            </Col>
            <Col md={6}>
              <div className="d-flex align-items-center mb-2">
                <FaCalendarAlt className="me-2 text-secondary" />
                <span className="text-muted fw-semibold small me-2">Date Submitted:</span>
                <span className="text-dark">{complaint.submittedDate || 'N/A'}</span>
              </div>
            </Col>
            <Col xs={12}>
              <div className="mb-2">
                <span className="text-muted fw-semibold small d-block mb-1">Location:</span>
                <LocationDisplay 
                  location={complaint.location} 
                  latitude={complaint.latitude} 
                  longitude={complaint.longitude} 
                  inline={true} 
                />
              </div>
            </Col>
            <Col xs={12}>
              <div className="mt-1">
                <span className="text-muted fw-semibold small d-block mb-1">Description:</span>
                <div className="p-3 bg-light rounded border text-dark small" style={{ whiteSpace: 'pre-line' }}>
                  {complaint.description || 'No description provided.'}
                </div>
              </div>
            </Col>
          </Row>
        </Card.Body>
      </Card>

      {/* 2. Submit Work Completion Card */}
      <Card className="border-0 shadow-sm rounded-3 mb-4">
        <Card.Header className="bg-white border-bottom py-3 px-4">
          <h5 className="mb-0 fw-bold d-flex align-items-center text-dark">
            <FaCheckCircle className="text-primary me-2" /> Submit Work Completion
          </h5>
        </Card.Header>
        <Card.Body className="p-3 p-sm-4">
          {/* Resolved State: Hide form, show clear message, do not display controls to resubmit */}
          {isResolved && (
            <div className="p-3 rounded border border-success-subtle bg-light">
              <h6 className="fw-bold text-success d-flex align-items-center mb-2">
                <FaCheckCircle className="me-2" /> Complaint Successfully Resolved
              </h6>
              <p className="text-dark fw-medium mb-0">
                The citizen has confirmed that the issue was resolved.
              </p>
            </div>
          )}

          {/* Awaiting Citizen Confirmation state: Form is disabled/hidden while awaiting citizen response */}
          {isCompletedAwaiting && (
            <div className="p-3 rounded border border-primary-subtle bg-light">
              <h6 className="fw-bold text-primary d-flex align-items-center mb-2">
                <FaClock className="me-2" /> Awaiting Citizen Confirmation
              </h6>
              <p className="text-muted small mb-3">
                Work completion has been submitted. The citizen has been requested to verify and confirm whether the issue has been resolved. The completion form is disabled until the citizen responds.
              </p>
              {complaint.latest_completion && (
                <div className="p-3 rounded bg-white border small">
                  <div className="fw-semibold text-dark mb-1">
                    Submitted Remarks: "{complaint.latest_completion.completion_remarks || 'Work completed.'}"
                  </div>
                  <div className="text-muted" style={{ fontSize: '0.8rem' }}>
                    Reported by {complaint.latest_completion.submitted_by_name || 'Staff'} on {complaint.latest_completion.submitted_at_formatted || 'Recently'}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* 1. Pending state: Assigned staff member must explicitly start work */}
          {isPending && (
            <div className="p-3 rounded border border-warning-subtle bg-light">
              <h6 className="fw-bold text-dark d-flex align-items-center mb-2">
                <FaClock className="me-2 text-warning" /> Work Not Yet Started
              </h6>
              <p className="text-muted small mb-3">
                This complaint is currently <strong>Pending</strong>. Click below to start working on this complaint. This will update the status to <strong>In Progress</strong> and notify the citizen.
              </p>
              <Button 
                variant="primary" 
                onClick={handleStartWork}
                disabled={startingWork}
                className="fw-semibold px-4 py-2 w-100 w-sm-auto d-inline-flex align-items-center justify-content-center"
              >
                {startingWork ? (
                  <>
                    <Spinner size="sm" className="me-2" /> Starting Work...
                  </>
                ) : (
                  <>
                    <FaTools className="me-2" /> Start Work
                  </>
                )}
              </Button>
            </div>
          )}

          {/* 2. In Progress state: Staff completes work and submits for citizen confirmation */}
          {isInProgress && (
            <>
              <p className="text-muted mb-3">
                Describe the work completed. The citizen will be asked to confirm whether the issue has been resolved.
              </p>

              {/* If citizen disputed previously and complaint is back In Progress */}
              {complaint.latest_completion && complaint.latest_completion.citizen_response === 'Disputed' && (
                <Alert variant="warning" className="small mb-4 border-warning">
                  <div className="d-flex align-items-start">
                    <FaExclamationTriangle className="me-2 mt-1 text-warning flex-shrink-0" size={16} />
                    <div>
                      <div className="fw-bold text-dark">Citizen Feedback: "{complaint.latest_completion.citizen_remarks}"</div>
                      <div className="text-muted mt-1">
                        The citizen reported that the issue was not fixed. Please carry out the required work and submit completion again once resolved.
                      </div>
                    </div>
                  </div>
                </Alert>
              )}

              <Form onSubmit={handleSubmitCompletion}>
                <Form.Group className="mb-3">
                  <Form.Label className="fw-semibold text-dark small">
                    Completion Remarks <span className="text-danger">*</span>
                  </Form.Label>
                  <Form.Control
                    as="textarea"
                    rows={3}
                    placeholder="Describe what was done to resolve the complaint..."
                    value={completionRemarks}
                    onChange={(e) => setCompletionRemarks(e.target.value)}
                    required
                  />
                </Form.Group>
                <div className="d-flex justify-content-start">
                  <Button 
                    variant="primary" 
                    type="submit" 
                    disabled={saving}
                    className="fw-semibold px-4 py-2 w-100 w-sm-auto d-inline-flex align-items-center justify-content-center"
                  >
                    {saving ? (
                      <>
                        <Spinner size="sm" className="me-2" /> Submitting...
                      </>
                    ) : (
                      <>
                        <FaPaperPlane className="me-2" /> Submit for Citizen Confirmation
                      </>
                    )}
                  </Button>
                </div>
              </Form>
            </>
          )}

          {/* Rejected state */}
          {isRejected && (
            <div className="p-3 rounded border border-danger-subtle bg-light">
              <h6 className="fw-bold text-danger d-flex align-items-center mb-1">
                Complaint Rejected
              </h6>
              <p className="text-muted small mb-0">
                {complaint.rejection_reason 
                  ? `Rejection Reason: ${complaint.rejection_reason}`
                  : 'This complaint was rejected. No further work is required.'}
              </p>
              {complaint.rejected_by_name && (
                <div className="text-muted small mt-1" style={{ fontSize: '0.8rem' }}>
                  Rejected by {complaint.rejected_by_name} {complaint.rejected_at_formatted ? `on ${complaint.rejected_at_formatted}` : ''}
                </div>
              )}
            </div>
          )}
        </Card.Body>
      </Card>

      {/* 3. Complaint Timeline Card */}
      <Card className="border-0 shadow-sm rounded-3 mb-4">
        <Card.Header className="bg-white border-bottom py-3 px-3 px-sm-4">
          <h5 className="mb-0 fw-bold d-flex align-items-center text-dark fs-5">
            <FaHistory className="text-primary me-2" /> Complaint Timeline
          </h5>
        </Card.Header>
        <Card.Body className="p-3 p-sm-4">
          {timelineHistory.length === 0 ? (
            <div className="text-muted text-center py-3">No timeline events recorded yet.</div>
          ) : (
            <div className="timeline-container position-relative ps-2">
              {timelineHistory.map((item, index) => {
                const isLast = index === timelineHistory.length - 1;
                const dotColor = getTimelineDotColor(item.status);
                const actionLabel = getTimelineActionLabel(item);
                const eventDesc = getTimelineEventDescription(item);
                const eventTime = formatDateTime(item.updated_at);

                return (
                  <div key={item.id || index} className="timeline-entry position-relative ps-4 pb-4">
                    {/* Vertical line connecting nodes */}
                    {!isLast && (
                      <div 
                        className="position-absolute" 
                        style={{
                          left: '6px',
                          top: '20px',
                          bottom: '0',
                          width: '2px',
                          backgroundColor: '#E2E8F0'
                        }}
                      />
                    )}

                    {/* Timeline dot */}
                    <div 
                      className="position-absolute rounded-circle shadow-sm"
                      style={{
                        left: '0px',
                        top: '4px',
                        width: '14px',
                        height: '14px',
                        backgroundColor: dotColor,
                        border: '2px solid #FFFFFF'
                      }}
                    />

                    {/* Content */}
                    <div className="bg-light p-3 rounded border">
                      <div className="d-flex justify-content-between align-items-center flex-wrap gap-2 mb-2">
                        <div className="d-flex align-items-center gap-2 flex-wrap">
                          {getStatusBadge(item.status)}
                          <span className="fw-semibold text-dark small">
                            {actionLabel}
                          </span>
                        </div>
                        {eventTime && (
                          <span className="text-muted small" style={{ fontSize: '0.8rem' }}>
                            {eventTime}
                          </span>
                        )}
                      </div>
                      <div className="text-secondary small">
                        {eventDesc}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </Card.Body>
      </Card>
    </div>
  );
};

class ComplaintDetailsErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error("StaffComplaintDetails rendering error:", error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="mx-auto py-4" style={{ maxWidth: '960px' }}>
          <Alert variant="danger">
            <h5 className="alert-heading fw-bold mb-2">Unable to display complaint details</h5>
            <p className="mb-0">
              An unexpected error occurred while rendering the complaint details.
            </p>
          </Alert>
          <Button 
            as={Link} 
            to="/dashboard/department_staff" 
            variant="primary"
            className="d-inline-flex align-items-center mt-3"
          >
            <FaArrowLeft className="me-2" /> Back to Assigned Complaints
          </Button>
        </div>
      );
    }
    return this.props.children;
  }
}

const StaffComplaintDetailsPage = () => (
  <ComplaintDetailsErrorBoundary>
    <ComplaintDetails />
  </ComplaintDetailsErrorBoundary>
);

export default StaffComplaintDetailsPage;
