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
  FaTools,
  FaCamera,
  FaImage,
  FaTimes
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
  const [currentUser, setCurrentUser] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem('user') || '{}');
    } catch {
      return {};
    }
  });
  
  const [completionRemarks, setCompletionRemarks] = useState('');
  const [completionPhoto, setCompletionPhoto] = useState(null);
  const [photoPreview, setPhotoPreview] = useState(null);
  const [startingWork, setStartingWork] = useState(false);

  const handlePhotoChange = (e) => {
    const file = e.target.files && e.target.files[0];
    if (file) {
      setCompletionPhoto(file);
      setPhotoPreview(URL.createObjectURL(file));
    } else {
      setCompletionPhoto(null);
      setPhotoPreview(null);
    }
  };

  useEffect(() => {
    let isMounted = true;
    const fetchData = async () => {
      try {
        setLoading(true);
        setError('');
        const [profileData, data] = await Promise.all([
          api.getProfile().catch(() => null),
          api.getComplaintDetails(id)
        ]);
        if (isMounted) {
          if (profileData) setCurrentUser(profileData);
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

  // Check if complaint has active staff assignments (Assigned Team is not None)
  const hasActiveAssignments = () => {
    if (!complaint) return false;
    const members = complaint.assigned_staff_members || [];
    return members.length > 0;
  };

  // Check if complaint is explicitly assigned to the currently logged-in staff member
  const isAssignedToCurrentUser = () => {
    if (!complaint) return false;

    // 1. Check if backend database serialization explicitly confirmed assignment
    if (complaint.is_assigned_to_current_user === true) {
      return true;
    }

    const assignedMembers = complaint.assigned_staff_members || [];
    if (assignedMembers.length === 0) {
      return false;
    }

    const userEmail = (currentUser?.email || '').toLowerCase().trim();
    const userId = currentUser?.id || currentUser?.user_id;
    const staffId = currentUser?.staff_id;

    return assignedMembers.some(m => {
      const mEmail = (m.staff_email || m.email || '').toLowerCase().trim();
      const mUserId = m.user_id;
      const mStaffId = m.staff_id || m.id;

      if (userEmail && mEmail && userEmail === mEmail) return true;
      if (userId && mUserId && String(userId) === String(mUserId)) return true;
      if (staffId && mStaffId && String(staffId) === String(mStaffId)) return true;
      return false;
    });
  };

  const handleStartWork = async () => {
    if (!hasActiveAssignments()) {
      setError('Cannot start work: This complaint is unassigned (Assigned Team is None).');
      return;
    }
    if (!isAssignedToCurrentUser()) {
      setError('You cannot start work on this complaint because it is not explicitly assigned to you.');
      return;
    }

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
    if (!completionPhoto) {
      setError('Please upload a completion photo showing the completed work.');
      return;
    }

    setSaving(true);
    setError('');
    setSuccess('');

    try {
      const formData = new FormData();
      formData.append('completion_remarks', completionRemarks.trim());
      formData.append('completion_image', completionPhoto);

      const updated = await api.submitCompletion(id, formData);
      setComplaint(updated);
      setCompletionRemarks('');
      setCompletionPhoto(null);
      setPhotoPreview(null);
      setSuccess('Work completion submitted successfully! Status changed to Awaiting Authority Verification.');
    } catch (err) {
      setError(err.message || 'Failed to submit work completion.');
    } finally {
      setSaving(false);
    }
  };

  // Helper to dynamically resolve the actual registered citizen's name
  const getCitizenDisplayName = () => {
    if (!complaint) return 'Citizen';
    const name = (complaint.citizen_name || complaint.citizen_full_name || '').trim();
    if (name && name !== 'Citizen One') {
      return name;
    }
    if (complaint.citizen_email && complaint.citizen_email !== 'citizen@example.com') {
      return complaint.citizen_email;
    }
    return (name && name !== 'Citizen One') ? name : 'Citizen';
  };

  // Helper for consistent status badges
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

  // Helper for timeline dot color
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

  // Friendly actor name fallback
  const getActorDisplayName = (item) => {
    if (item.updated_by_name && item.updated_by_name !== 'System') {
      if (item.updated_by_name === 'Authority One') {
        return 'Municipal Authority';
      }
      if (item.updated_by_name === 'Citizen One') {
        return getCitizenDisplayName();
      }
      if (!item.updated_by_name.includes('@')) {
        return item.updated_by_name;
      }
    }
    if (item.updated_by_name === 'Authority One' || item.updated_by_role === 'MUNICIPAL_AUTHORITY') {
      return 'Municipal Authority';
    }
    if (item.updated_by_role === 'DEPARTMENT_STAFF') {
      return 'Department Staff';
    }
    if (item.updated_by_name === 'Citizen One' || item.updated_by_role === 'CITIZEN') {
      return getCitizenDisplayName();
    }
    return 'System';
  };

  // Meaningful action header for timeline
  const getTimelineActionLabel = (item) => {
    const actor = getActorDisplayName(item);
    const remarks = (item.remarks || '').toLowerCase();

    // Assignment actions must ALWAYS be labelled as assigned by the actor
    if (remarks.includes('assigned') || item.updated_by_role === 'MUNICIPAL_AUTHORITY') {
      if (remarks.includes('verified') || remarks.includes('approved')) {
        return `Verified & Approved by ${actor}`;
      }
      if (remarks.includes('rejected')) {
        return `Verification Rejected by ${actor}`;
      }
      return `Assigned by ${actor}`;
    }
    if (item.status === 'Pending') {
      return `Submitted by ${actor}`;
    }
    if (item.status === 'Awaiting Authority Verification' || item.status === 'Awaiting Citizen Confirmation') {
      return `Completion submitted by ${actor}`;
    }
    if (item.status === 'Resolved') {
      return item.updated_by_role === 'MUNICIPAL_AUTHORITY' ? `Verified & Approved by ${actor}` : `Resolved by ${actor}`;
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
        return `Complaint submitted by ${getCitizenDisplayName()}.`;
      }
      return rawRemarks;
    }

    if (item.status === 'In Progress') {
      if (lower.startsWith('assigned to')) {
        return rawRemarks;
      }
      return rawRemarks || 'Complaint status updated to In Progress.';
    }

    if (item.status === 'Awaiting Authority Verification' || item.status === 'Awaiting Citizen Confirmation') {
      if (rawRemarks) {
        return `Work completion submitted: "${rawRemarks}"`;
      }
      return 'Work completion submitted. Awaiting Municipal Authority verification.';
    }

    if (item.status === 'Resolved') {
      return rawRemarks || 'Complaint verified and marked as Resolved by Municipal Authority.';
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
  const isCompletedAwaiting = complaint.status === 'Awaiting Authority Verification' || complaint.status === 'Awaiting Citizen Confirmation';
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
            <h2 className="fw-bold mb-1 text-white fs-3 fs-sm-2">Complaint Task Details</h2>
            <p className="text-secondary mb-0">Review task details and submit work completion for municipal authority verification.</p>
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
                <span className="text-dark fw-medium">{getCitizenDisplayName()}</span>
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
                      {complaint.assigned_staff_members.map(s => {
                        const sEmail = (s.staff_email || s.email || '').toLowerCase().trim();
                        const myEmail = (currentUser?.email || '').toLowerCase().trim();
                        const isYou = (sEmail && sEmail === myEmail) || (s.user_id && String(s.user_id) === String(currentUser?.id || currentUser?.user_id));
                        return (
                          <Badge key={s.id || s.staff_id} bg={isYou ? "primary" : "secondary"} className="fw-normal px-2 py-1">
                            {s.staff_name || s.name || s.staff_email} {isYou && '(You)'}
                          </Badge>
                        );
                      })}
                    </div>
                  ) : (
                    <span className="text-muted small">None</span>
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
              <p className="text-dark fw-medium mb-1">
                The Municipal Authority has verified and approved the resolution.
              </p>
              {complaint.verified_by_name && (
                <div className="text-muted small mb-2">
                  Verified by <strong>{complaint.verified_by_name === 'Authority One' ? 'Municipal Authority' : complaint.verified_by_name}</strong> {complaint.verified_at_formatted ? `on ${complaint.verified_at_formatted}` : ''}
                </div>
              )}
              {complaint.verification_remarks && (
                <div className="p-2 rounded bg-white border small text-dark mb-2">
                  <strong>Authority Remarks:</strong> "{complaint.verification_remarks}"
                </div>
              )}
              {complaint.completion_photo && (
                <div className="mt-3">
                  <span className="text-muted small fw-semibold d-block mb-1">Verified Completion Photo:</span>
                  <img
                    src={complaint.completion_photo.startsWith('http') ? complaint.completion_photo : `http://127.0.0.1:8000${complaint.completion_photo}`}
                    alt="Work Completion"
                    className="rounded border shadow-sm"
                    style={{ maxHeight: '200px', maxWidth: '100%', objectFit: 'cover' }}
                  />
                </div>
              )}
            </div>
          )}

          {/* Awaiting Authority Verification state: Form is disabled/hidden while awaiting authority review */}
          {isCompletedAwaiting && (
            <div className="p-3 rounded border border-primary-subtle bg-light">
              <h6 className="fw-bold text-primary d-flex align-items-center mb-2">
                <FaClock className="me-2" /> Awaiting Authority Verification
              </h6>
              <p className="text-muted small mb-3">
                Work completion has been submitted. The Municipal Authority is reviewing the completion photo and remarks before approving resolution. The completion form is disabled until the verification is completed.
              </p>
              {complaint.latest_completion && (
                <div className="p-3 rounded bg-white border small mb-3">
                  <div className="fw-semibold text-dark mb-1">
                    Submitted Remarks: "{complaint.latest_completion.completion_remarks || 'Work completed.'}"
                  </div>
                  <div className="text-muted" style={{ fontSize: '0.8rem' }}>
                    Reported by {complaint.latest_completion.submitted_by_name || 'Staff'} on {complaint.latest_completion.submitted_at_formatted || 'Recently'}
                  </div>
                </div>
              )}
              {complaint.completion_photo && (
                <div className="mt-2">
                  <span className="text-muted small fw-semibold d-block mb-1">Uploaded Completion Photo:</span>
                  <img
                    src={complaint.completion_photo.startsWith('http') ? complaint.completion_photo : `http://127.0.0.1:8000${complaint.completion_photo}`}
                    alt="Completion Evidence"
                    className="rounded border shadow-sm"
                    style={{ maxHeight: '200px', maxWidth: '100%', objectFit: 'cover' }}
                  />
                </div>
              )}
            </div>
          )}

          {/* 1. Pending state: Only explicitly assigned staff member can start work */}
          {isPending && (
            <div className="p-3 rounded border border-warning-subtle bg-light">
              <h6 className="fw-bold text-dark d-flex align-items-center mb-2">
                <FaClock className="me-2 text-warning" /> Work Not Yet Started
              </h6>

              {!hasActiveAssignments() ? (
                /* Case A: Complaint has NO assigned team (Assigned Team is None) */
                <div>
                  <p className="text-muted small mb-3">
                    This complaint is currently <strong>Pending</strong>, but no staff member is assigned (<strong>Assigned Team: None</strong>). Work cannot be started until a Municipal Authority assigns this complaint to you.
                  </p>
                  <Button 
                    variant="secondary" 
                    disabled={true}
                    className="fw-semibold px-4 py-2 w-100 w-sm-auto d-inline-flex align-items-center justify-content-center opacity-75"
                    title="Cannot start work: Assigned Team is None"
                  >
                    <FaTools className="me-2" /> Start Work (Unassigned)
                  </Button>
                </div>
              ) : isAssignedToCurrentUser() ? (
                /* Case B: Explicitly assigned to the currently logged-in staff member */
                <div>
                  <p className="text-muted small mb-3">
                    This complaint is currently <strong>Pending</strong> and assigned to you. Click below to start working on this complaint. This will update the status to <strong>In Progress</strong> and notify the citizen.
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
              ) : (
                /* Case C: Assigned to another staff member */
                <div>
                  <p className="text-muted small mb-3">
                    This complaint is currently <strong>Pending</strong> and assigned to another staff member (
                    <strong>
                      {(complaint.assigned_staff_members || []).map(m => m.staff_name || m.name || m.staff_email).join(', ') || 'Another Staff Member'}
                    </strong>
                    ). Only the assigned staff member is authorized to start work on this task.
                  </p>
                  <Button 
                    variant="secondary" 
                    disabled={true}
                    className="fw-semibold px-4 py-2 w-100 w-sm-auto d-inline-flex align-items-center justify-content-center opacity-75"
                    title="Cannot start work: Assigned to another staff member"
                  >
                    <FaTools className="me-2" /> Start Work (Assigned to Other Staff)
                  </Button>
                </div>
              )}
            </div>
          )}

          {/* 2. In Progress state: Staff completes work and submits for authority verification */}
          {isInProgress && (
            <>
              <p className="text-muted mb-3">
                Add a completion description (optional) and upload a completion photo.
              </p>

              {/* If authority rejected completion previously and returned complaint to In Progress */}
              {(complaint.latest_completion?.verification_status === 'Rejected' || (complaint.verification_remarks && isInProgress)) && (
                <Alert variant="danger" className="small mb-4 border-danger">
                  <div className="d-flex align-items-start">
                    <FaExclamationTriangle className="me-2 mt-1 text-danger flex-shrink-0" size={16} />
                    <div>
                      <div className="fw-bold text-dark">
                        Authority Verification Rejected: "{complaint.latest_completion?.verification_remarks || complaint.verification_remarks}"
                      </div>
                      <div className="text-muted mt-1">
                        The Municipal Authority rejected the completion report. Please carry out the required rework, then upload a new completion photo and remarks below.
                      </div>
                    </div>
                  </div>
                </Alert>
              )}

              <Form onSubmit={handleSubmitCompletion}>
                <Form.Group className="mb-3">
                  <Form.Label className="fw-semibold text-dark small">
                    Completion Remarks
                  </Form.Label>
                  <Form.Control
                    as="textarea"
                    rows={3}
                    placeholder="Add a completion description (optional)..."
                    value={completionRemarks}
                    onChange={(e) => setCompletionRemarks(e.target.value)}
                  />
                </Form.Group>

                <Form.Group className="mb-4">
                  <Form.Label className="fw-semibold text-dark small d-flex align-items-center">
                    <FaCamera className="me-2 text-primary" />
                    Completion Photo <span className="text-danger">*</span>
                  </Form.Label>
                  <Form.Control
                    type="file"
                    accept="image/*"
                    onChange={handlePhotoChange}
                    required
                    className="shadow-none"
                  />
                  <Form.Text className="text-muted">
                    Upload clear photographic evidence demonstrating that work is completed.
                  </Form.Text>

                  {photoPreview && (
                    <div className="mt-3 p-2 bg-light border rounded position-relative d-inline-block">
                      <img
                        src={photoPreview}
                        alt="Completion Preview"
                        className="rounded"
                        style={{ maxHeight: '180px', maxWidth: '100%', objectFit: 'cover' }}
                      />
                      <Button
                        variant="dark"
                        size="sm"
                        className="position-absolute top-0 end-0 m-1 rounded-circle p-1"
                        style={{ width: '26px', height: '26px', lineHeight: 1 }}
                        onClick={() => {
                          setCompletionPhoto(null);
                          setPhotoPreview(null);
                        }}
                        title="Remove photo"
                      >
                        <FaTimes size={12} />
                      </Button>
                    </div>
                  )}
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
                        <FaPaperPlane className="me-2" /> Submit for Authority Verification
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
                  Rejected by {complaint.rejected_by_name === 'Authority One' ? 'Municipal Authority' : complaint.rejected_by_name} {complaint.rejected_at_formatted ? `on ${complaint.rejected_at_formatted}` : ''}
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
