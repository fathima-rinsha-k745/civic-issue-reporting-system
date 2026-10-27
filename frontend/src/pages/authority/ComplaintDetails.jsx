import React, { useState, useEffect } from 'react';
import { Card, Badge, Spinner, Button, Row, Col, Form, Alert, Modal } from 'react-bootstrap';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { api } from '../../services/api';
import LocationDisplay from '../../components/common/LocationDisplay';
import { FaUserCheck, FaArrowLeft, FaUsers, FaBan, FaCheckCircle, FaTimesCircle, FaStar, FaHistory, FaClock } from 'react-icons/fa';

const ComplaintDetails = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [complaint, setComplaint] = useState(null);
  const [departments, setDepartments] = useState([]);
  const [allStaff, setAllStaff] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const [selectedDepartment, setSelectedDepartment] = useState('');
  const [selectedStaffIds, setSelectedStaffIds] = useState([]);

  // Initial rejection modal state (for Pending complaints before assignment)
  const [showRejectModal, setShowRejectModal] = useState(false);
  const [rejectCategory, setRejectCategory] = useState('Duplicate complaint');
  const [customExplanation, setCustomExplanation] = useState('');
  const [rejectModalError, setRejectModalError] = useState('');
  const [rejecting, setRejecting] = useState(false);

  // Authority Verification state (for Awaiting Authority Verification complaints)
  const [showVerifyRejectModal, setShowVerifyRejectModal] = useState(false);
  const [verifyRejectReason, setVerifyRejectReason] = useState('');
  const [verifyApprovalRemarks, setVerifyApprovalRemarks] = useState('');
  const [verifying, setVerifying] = useState(false);
  const [verifyError, setVerifyError] = useState('');

  const handleApproveVerification = async () => {
    setVerifying(true);
    setVerifyError('');
    setError('');
    setSuccess('');
    try {
      const updated = await api.verifyComplaint(id, {
        action: 'approve',
        remarks: verifyApprovalRemarks.trim() || 'Work completion inspected and approved by Municipal Authority.'
      });
      setComplaint(updated);
      setSuccess('Complaint verification approved! Status has been updated to Resolved and the citizen has been notified.');
    } catch (err) {
      setVerifyError(err.message || 'Failed to approve completion.');
    } finally {
      setVerifying(false);
    }
  };

  const handleRejectVerification = async () => {
    if (!verifyRejectReason.trim()) {
      setVerifyError('Please enter a rejection reason describing why the work was rejected.');
      return;
    }
    setVerifying(true);
    setVerifyError('');
    setError('');
    setSuccess('');
    try {
      const updated = await api.verifyComplaint(id, {
        action: 'reject',
        rejection_reason: verifyRejectReason.trim()
      });
      setComplaint(updated);
      setShowVerifyRejectModal(false);
      setVerifyRejectReason('');
      setSuccess('Work completion rejected. The complaint has been returned to In Progress and the assigned staff and citizen have been notified.');
    } catch (err) {
      setVerifyError(err.message || 'Failed to reject completion.');
    } finally {
      setVerifying(false);
    }
  };

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const [complaintData, deptsData, staffData] = await Promise.all([
          api.getComplaintDetails(id),
          api.getDepartments().catch(() => []),
          api.getStaff().catch(() => [])
        ]);
        setComplaint(complaintData);
        setDepartments(deptsData);
        setAllStaff(staffData);

        const currentDeptId = complaintData.department_id || (complaintData.department && deptsData.find(d => d.name === complaintData.department)?.id) || '';
        setSelectedDepartment(String(currentDeptId || ''));
        setSelectedStaffIds(complaintData.assigned_staff_ids || []);
      } catch (err) {
        setError('Failed to load complaint details.');
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [id]);

  const handleDepartmentChange = (newDeptId) => {
    setSelectedDepartment(newDeptId);
    // When department changes, filter out any staff who don't belong to the newly selected department
    setSelectedStaffIds(prev => prev.filter(staffId => {
      const s = allStaff.find(st => String(st.id) === String(staffId));
      return s && String(s.department) === String(newDeptId);
    }));
  };

  const handleToggleStaff = (staffId) => {
    setSelectedStaffIds(prev => {
      if (prev.includes(staffId)) {
        return prev.filter(sId => sId !== staffId);
      } else {
        return [...prev, staffId];
      }
    });
  };

  const availableStaff = allStaff.filter(s =>
    String(s.department) === String(selectedDepartment) &&
    s.is_active &&
    !s.is_generic &&
    !(s.full_name && s.full_name.toLowerCase().includes('department staff')) &&
    !(s.email && s.email.toLowerCase().startsWith('staff_'))
  );

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
      const dept = departments.find(d => String(d.id) === String(selectedDepartment));
      const deptId = dept ? dept.id : parseInt(selectedDepartment, 10);

      const updated = await api.updateComplaint(id, {
        department: deptId,
        assigned_staff_ids: selectedStaffIds,
        remarks: `Assigned to ${dept ? dept.name : 'Department'} with ${selectedStaffIds.length} staff member(s).`
      });
      setComplaint(updated);
      setSelectedStaffIds(updated.assigned_staff_ids || []);
      setSuccess('Department and staff assignments saved successfully.');
    } catch (err) {
      setError(err.message || 'Failed to assign department and staff.');
    } finally {
      setSaving(false);
    }
  };

  const handleConfirmReject = async () => {
    let finalReason = rejectCategory;
    if (rejectCategory === 'Other') {
      if (!customExplanation.trim()) {
        setRejectModalError('Please provide a mandatory explanation when selecting Other.');
        return;
      }
      finalReason = customExplanation.trim();
    } else if (customExplanation.trim()) {
      finalReason = `${rejectCategory}: ${customExplanation.trim()}`;
    }

    setRejecting(true);
    setRejectModalError('');
    try {
      const updated = await api.rejectComplaint(id, finalReason);
      setComplaint(updated);
      setShowRejectModal(false);
      setSuccess('Complaint has been rejected successfully and the citizen has been notified.');
    } catch (err) {
      setRejectModalError(err.message || 'Failed to reject complaint.');
    } finally {
      setRejecting(false);
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

  // An authority can only reject complaints that are Pending and unassigned
  const isEligibleForRejection = complaint.status === 'Pending' &&
    (!complaint.department || complaint.department === 'Unassigned') &&
    (!complaint.assigned_staff_members || complaint.assigned_staff_members.length === 0) &&
    (!complaint.assigned_staff_ids || complaint.assigned_staff_ids.length === 0);

  const isResolved = complaint.status === 'Resolved';
  const isRejected = complaint.status === 'Rejected';
  const isAwaitingVerification = complaint.status === 'Awaiting Authority Verification' || complaint.status === 'Awaiting Citizen Confirmation';

  const getStatusBadgeStyle = (status) => {
    switch (status) {
      case 'Resolved':
        return { bg: 'rgba(34, 197, 94, 0.18)', color: '#4ADE80', border: 'rgba(34, 197, 94, 0.45)' };
      case 'In Progress':
        return { bg: 'rgba(6, 182, 212, 0.18)', color: '#38BDF8', border: 'rgba(6, 182, 212, 0.45)' };
      case 'Awaiting Authority Verification':
      case 'Awaiting Citizen Confirmation':
        return { bg: 'rgba(139, 92, 246, 0.2)', color: '#C4B5FD', border: 'rgba(139, 92, 246, 0.45)' };
      case 'Rejected':
        return { bg: 'rgba(239, 68, 68, 0.18)', color: '#F87171', border: 'rgba(239, 68, 68, 0.45)' };
      case 'Pending':
      default:
        return { bg: 'rgba(245, 158, 11, 0.18)', color: '#FBBF24', border: 'rgba(245, 158, 11, 0.45)' };
    }
  };

  const badgeStyle = getStatusBadgeStyle(complaint.status);

  return (
    <div className="mx-auto" style={{ maxWidth: '1000px' }}>
      <div className="mb-4">
        <Button
          as={Link}
          to="/dashboard/municipal_authority/complaints"
          variant="link"
          className="text-decoration-none text-muted px-0 mb-2 d-inline-flex align-items-center"
        >
          <FaArrowLeft className="me-2" /> Back to list
        </Button>
        <h2 className="fw-bold mb-1 text-white fs-3 fs-sm-2">Complaint Details</h2>
        <p className="text-secondary mb-0">Review complete complaint information, assign department and staff, and verify resolution.</p>
      </div>

      {error && <Alert variant="danger" dismissible onClose={() => setError('')}>{error}</Alert>}
      {success && <Alert variant="success" dismissible onClose={() => setSuccess('')}>{success}</Alert>}

      {/* Prominent Banner if Complaint is Rejected */}
      {isRejected && (
        <Alert variant="danger" className="mb-4 shadow-sm border-danger">
          <div className="d-flex align-items-start">
            <FaBan className="fs-3 text-danger me-3 mt-1 flex-shrink-0" />
            <div>
              <h5 className="alert-heading fw-bold mb-1">Complaint Rejected</h5>
              <p className="mb-1 text-dark">
                This complaint was rejected by <strong>{complaint.rejected_by_name || 'Municipal Authority'}</strong>
                {complaint.rejected_at_formatted ? ` on ${complaint.rejected_at_formatted}` : ''}.
              </p>
              <div className="mt-2 p-2 bg-white rounded border border-danger-subtle small text-dark">
                <strong>Rejection Reason:</strong> {complaint.rejection_reason || 'Not specified'}
              </div>
            </div>
          </div>
        </Alert>
      )}

      {/* Banner if Complaint is Resolved */}
      {isResolved && (
        <Alert variant="success" className="mb-4 shadow-sm border-success">
          <div className="d-flex align-items-start">
            <FaCheckCircle className="fs-3 text-success me-3 mt-1 flex-shrink-0" />
            <div>
              <h5 className="alert-heading fw-bold mb-1">Complaint Verified & Resolved</h5>
              <p className="mb-1 text-dark">
                This complaint was inspected and approved as resolved by <strong>{complaint.verified_by_name || 'Municipal Authority'}</strong>
                {complaint.verified_at_formatted ? ` on ${complaint.verified_at_formatted}` : ''}.
              </p>
              {complaint.verification_remarks && (
                <div className="mt-2 p-2 bg-white rounded border border-success-subtle small text-dark">
                  <strong>Verification Remarks:</strong> "{complaint.verification_remarks}"
                </div>
              )}
            </div>
          </div>
        </Alert>
      )}

      <Card className="border-0 shadow-sm rounded-3 overflow-hidden mb-4">
        <Card.Body className="p-0">
          <Row className="g-0">
            {/* Left side: Photo */}
            <Col md={4} className="bg-light p-3 p-sm-4 d-flex align-items-center justify-content-center border-bottom border-md-bottom-0 border-md-end">
              {complaint.photo ? (
                <img
                  src={complaint.photo.startsWith('http') ? complaint.photo : `http://127.0.0.1:8000${complaint.photo}`}
                  alt="Complaint Evidence"
                  className="img-fluid rounded shadow-sm"
                  style={{ maxWidth: '100%', maxHeight: '280px', objectFit: 'cover' }}
                />
              ) : (
                <div className="text-muted text-center border rounded bg-white d-flex align-items-center justify-content-center" style={{ maxWidth: '240px', width: '100%', height: '140px' }}>
                  No photo available
                </div>
              )}
            </Col>

            {/* Right side: Details & Form */}
            <Col md={8} className="p-3 p-sm-4 p-md-5 d-flex flex-column">
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
                  <Col sm={8}>
                    <LocationDisplay
                      location={complaint.location}
                      latitude={complaint.latitude}
                      longitude={complaint.longitude}
                      inline={true}
                    />
                  </Col>
                </Row>
                <Row className="mb-3">
                  <Col sm={4} className="text-muted fw-semibold">Status</Col>
                  <Col sm={8}>
                    : <span className="ms-1 px-3 py-1 rounded-pill" style={{
                      backgroundColor: badgeStyle.bg,
                      color: badgeStyle.color,
                      border: `1px solid ${badgeStyle.border}`,
                      fontSize: '0.9rem',
                      fontWeight: '600'
                    }}>
                      {complaint.status}
                    </span>
                  </Col>
                </Row>
                <Row className="mb-3">
                  <Col sm={4} className="text-muted fw-semibold">Submitted On</Col>
                  <Col sm={8} className="text-dark">: {complaint.submittedDate}</Col>
                </Row>

                {/* Display Currently Assigned Staff */}
                <Row className="mb-3">
                  <Col sm={4} className="text-muted fw-semibold">Assigned Staff</Col>
                  <Col sm={8}>
                    : {complaint.assigned_staff_members && complaint.assigned_staff_members.length > 0 ? (
                      <div className="d-inline-flex flex-wrap gap-1 align-items-center">
                        {complaint.assigned_staff_members.map(s => (
                          <Badge key={s.id} bg="primary" className="fw-normal">
                            <FaUserCheck className="me-1" /> {s.staff_name || s.name || s.staff_email}
                          </Badge>
                        ))}
                      </div>
                    ) : (
                      <span className="text-muted">No staff assigned yet</span>
                    )}
                  </Col>
                </Row>

                {/* Latest Completion Remarks if awaiting or resolved */}
                {complaint.latest_completion && (
                  <Row className="mb-3">
                    <Col sm={4} className="text-muted fw-semibold">Completion Remarks</Col>
                    <Col sm={8} className="text-dark">
                      <div className="p-2 rounded bg-light border">
                        <small className="d-block text-muted mb-1">
                          Reported by <strong>{complaint.latest_completion.submitted_by_name}</strong> on {complaint.latest_completion.submitted_at_formatted}:
                        </small>
                        <span>"{complaint.latest_completion.completion_remarks}"</span>
                        {complaint.latest_completion.verification_status && complaint.latest_completion.verification_status !== 'Pending' && (
                          <div className="mt-2 pt-2 border-top">
                            <small className="d-block text-muted">
                              Authority Verification: <strong>{complaint.latest_completion.verification_status === 'Approved' ? 'Approved & Resolved' : 'Rework Requested'}</strong>
                              {complaint.latest_completion.verified_at_formatted ? ` (${complaint.latest_completion.verified_at_formatted})` : ''}
                            </small>
                            {complaint.latest_completion.verification_remarks && (
                              <small className="text-secondary fst-italic">
                                Remarks: "{complaint.latest_completion.verification_remarks}"
                              </small>
                            )}
                          </div>
                        )}
                      </div>
                    </Col>
                  </Row>
                )}
              </div>

              <hr className="my-3 border-secondary opacity-25" />

              {/* Department & Multiple Staff Assignment Form */}
              {isRejected ? (
                <div className="alert alert-secondary py-3 text-center my-auto">
                  <FaBan className="me-2 text-danger" />
                  <strong>This complaint is rejected.</strong> Assignment to departments or staff is disabled.
                </div>
              ) : isResolved ? (
                <div className="alert alert-success py-3 text-center my-auto">
                  <FaCheckCircle className="me-2 text-success" />
                  <strong>This complaint is resolved.</strong> No further assignments are permitted.
                </div>
              ) : (
                <Form onSubmit={handleUpdate} className="mt-auto pt-3">
                  <Form.Group className="mb-3">
                    <Form.Label className="fw-bold text-dark">1. Select Department *</Form.Label>
                    <Form.Select
                      size="md"
                      value={selectedDepartment}
                      onChange={(e) => handleDepartmentChange(e.target.value)}
                      className="shadow-none border-secondary"
                      required
                    >
                      <option value="">-- Select Department --</option>
                      {departments.map(d => (
                        <option key={d.id} value={d.id}>{d.name}</option>
                      ))}
                    </Form.Select>
                  </Form.Group>

                  {selectedDepartment && (
                    <Form.Group className="mb-4">
                      <div className="d-flex justify-content-between align-items-center mb-2">
                        <Form.Label className="fw-bold text-dark mb-0 d-flex align-items-center">
                          <FaUsers className="me-2 text-primary" /> 2. Assign Staff Members (Multiple Selectable)
                        </Form.Label>
                        <small className="text-muted">
                          {selectedStaffIds.length} selected
                        </small>
                      </div>

                      {availableStaff.length === 0 ? (
                        <div className="alert alert-warning py-2 small mb-0">
                          No active staff members found for this department. You can add staff in the <strong>Manage Staff</strong> section.
                        </div>
                      ) : (
                        <div className="p-3 border rounded bg-light" style={{ maxHeight: '200px', overflowY: 'auto' }}>
                          {availableStaff.map(s => {
                            const isChecked = selectedStaffIds.includes(s.id);
                            return (
                              <Form.Check
                                key={s.id}
                                type="checkbox"
                                id={`staff-chk-${s.id}`}
                                className="mb-2"
                                label={
                                  <span>
                                    <strong>{s.full_name}</strong> <span className="text-muted small">({s.email})</span>
                                  </span>
                                }
                                checked={isChecked}
                                onChange={() => handleToggleStaff(s.id)}
                              />
                            );
                          })}
                        </div>
                      )}
                    </Form.Group>
                  )}

                  <div className="d-flex flex-column flex-sm-row gap-2 gap-sm-3 align-items-stretch align-items-sm-center">
                    <Button
                      variant="primary"
                      type="submit"
                      disabled={saving}
                      className="px-4 py-2 fw-semibold w-100 w-sm-auto d-inline-flex align-items-center justify-content-center"
                      style={{ backgroundColor: '#0d6efd', border: 'none', borderRadius: '6px' }}
                    >
                      {saving ? <Spinner size="sm" /> : 'Save Assignments'}
                    </Button>

                    {isEligibleForRejection && (
                      <Button
                        variant="outline-danger"
                        type="button"
                        onClick={() => {
                          setRejectCategory('Duplicate complaint');
                          setCustomExplanation('');
                          setRejectModalError('');
                          setShowRejectModal(true);
                        }}
                        className="px-4 py-2 fw-semibold w-100 w-sm-auto d-inline-flex align-items-center justify-content-center"
                        style={{ borderRadius: '6px' }}
                      >
                        <FaBan className="me-2" /> Reject Complaint
                      </Button>
                    )}

                    <Button
                      variant="outline-secondary"
                      onClick={() => navigate('/dashboard/municipal_authority/complaints')}
                      className="px-4 py-2 fw-semibold w-100 w-sm-auto d-inline-flex align-items-center justify-content-center"
                      style={{ borderRadius: '6px' }}
                    >
                      Cancel
                    </Button>
                  </div>
                </Form>
              )}
            </Col>
          </Row>
        </Card.Body>
      </Card>

      {/* Verification Review Card for Complaints Awaiting Verification */}
      {isAwaitingVerification && (
        <Card className="border-0 shadow-sm rounded-3 mb-4 overflow-hidden" style={{ borderLeft: '4px solid #8B5CF6' }}>
          <Card.Header className="py-3 px-4 d-flex justify-content-between align-items-center flex-wrap gap-2" style={{ backgroundColor: 'rgba(139, 92, 246, 0.12)' }}>
            <div className="d-flex align-items-center gap-2">
              <FaCheckCircle className="text-primary fs-5" />
              <h5 className="mb-0 fw-bold text-dark">Municipal Verification Required</h5>
            </div>
            <Badge bg="primary" className="px-3 py-1 fw-semibold">
              Awaiting Authority Verification
            </Badge>
          </Card.Header>
          <Card.Body className="p-3 p-sm-4">
            {verifyError && <Alert variant="danger" dismissible onClose={() => setVerifyError('')}>{verifyError}</Alert>}

            <p className="text-muted small mb-3">
              Department staff have completed the assigned work and submitted completion details. Compare the original complaint photo with the staff completion photo, review the completion remarks, and decide whether to <strong>Approve</strong> (mark as Resolved) or <strong>Reject</strong> (return to In Progress for rework).
            </p>

            {/* Side-by-side Photo Comparison */}
            <Row className="g-3 mb-4">
              <Col md={6}>
                <div className="p-3 rounded border bg-light h-100 d-flex flex-column">
                  <div className="d-flex justify-content-between align-items-center mb-2">
                    <span className="fw-bold text-dark small">Original Issue Photo (Citizen)</span>
                    <Badge bg="secondary" className="fw-normal">Before</Badge>
                  </div>
                  <div className="d-flex align-items-center justify-content-center flex-grow-1 bg-white rounded border overflow-hidden p-2" style={{ minHeight: '220px' }}>
                    {complaint.photo ? (
                      <img
                        src={complaint.photo.startsWith('http') ? complaint.photo : `http://127.0.0.1:8000${complaint.photo}`}
                        alt="Original Issue"
                        className="img-fluid rounded"
                        style={{ maxHeight: '240px', maxWidth: '100%', objectFit: 'contain' }}
                      />
                    ) : (
                      <span className="text-muted small">No original photo submitted</span>
                    )}
                  </div>
                </div>
              </Col>

              <Col md={6}>
                <div className="p-3 rounded border bg-light h-100 d-flex flex-column">
                  <div className="d-flex justify-content-between align-items-center mb-2">
                    <span className="fw-bold text-dark small">Completion Photo (Staff)</span>
                    <Badge bg="success" className="fw-normal">Completed Work</Badge>
                  </div>
                  <div className="d-flex align-items-center justify-content-center flex-grow-1 bg-white rounded border overflow-hidden p-2" style={{ minHeight: '220px' }}>
                    {complaint.completion_photo ? (
                      <img
                        src={complaint.completion_photo.startsWith('http') ? complaint.completion_photo : `http://127.0.0.1:8000${complaint.completion_photo}`}
                        alt="Staff Completion"
                        className="img-fluid rounded"
                        style={{ maxHeight: '240px', maxWidth: '100%', objectFit: 'contain' }}
                      />
                    ) : (
                      <span className="text-muted small">No completion photo uploaded</span>
                    )}
                  </div>
                </div>
              </Col>
            </Row>

            {/* Staff Completion Remarks */}
            <div className="p-3 rounded bg-light border mb-4">
              <div className="d-flex justify-content-between align-items-center flex-wrap gap-2 mb-1">
                <span className="fw-bold text-dark small">Staff Completion Remarks:</span>
                {complaint.latest_completion?.submitted_at_formatted && (
                  <span className="text-muted small">
                    Submitted on {complaint.latest_completion.submitted_at_formatted}
                    {complaint.latest_completion.submitted_by_name ? ` by ${complaint.latest_completion.submitted_by_name}` : ''}
                  </span>
                )}
              </div>
              <p className="text-dark small mb-0 fst-italic">
                "{complaint.latest_completion?.completion_remarks || complaint.completion_remarks || 'Work completed as requested.'}"
              </p>
            </div>

            {/* Authority Approval Remarks & Actions */}
            <Form.Group className="mb-3">
              <Form.Label className="fw-semibold text-dark small">
                Authority Verification Remarks (Optional for Approval)
              </Form.Label>
              <Form.Control
                type="text"
                placeholder="e.g., Inspected and verified on-site by Municipal Authority..."
                value={verifyApprovalRemarks}
                onChange={(e) => setVerifyApprovalRemarks(e.target.value)}
                disabled={verifying}
              />
            </Form.Group>

            <div className="d-flex flex-column flex-sm-row gap-2 gap-sm-3 pt-2">
              <Button
                variant="success"
                size="lg"
                onClick={handleApproveVerification}
                disabled={verifying}
                className="d-inline-flex align-items-center justify-content-center fw-semibold px-4 w-100 w-sm-auto"
              >
                {verifying ? <Spinner size="sm" className="me-2" /> : <FaCheckCircle className="me-2" />}
                Approve & Resolve Complaint
              </Button>

              <Button
                variant="outline-danger"
                size="lg"
                onClick={() => {
                  setVerifyRejectReason('');
                  setVerifyError('');
                  setShowVerifyRejectModal(true);
                }}
                disabled={verifying}
                className="d-inline-flex align-items-center justify-content-center fw-semibold px-4 w-100 w-sm-auto"
              >
                <FaTimesCircle className="me-2" />
                Reject & Return to In Progress
              </Button>
            </div>
          </Card.Body>
        </Card>
      )}

      {/* Citizen Feedback Display for Municipal Authority */}
      {isResolved && (
        <Card className="border-0 shadow-sm rounded-3 mb-4 overflow-hidden">
          <Card.Header className="bg-white border-bottom py-3 px-4 d-flex justify-content-between align-items-center">
            <h5 className="mb-0 fw-bold text-dark d-flex align-items-center">
              <FaStar className="text-warning me-2" /> Citizen Feedback & Rating
            </h5>
            {complaint.feedback && (
              <Badge bg="success" className="fw-normal">Feedback Received</Badge>
            )}
          </Card.Header>
          <Card.Body className="p-3 p-sm-4">
            {complaint.feedback ? (
              <div>
                <div className="d-flex align-items-center mb-3">
                  <span className="text-muted fw-semibold small me-3">Citizen Rating:</span>
                  {complaint.feedback.rating ? (
                    <div className="d-flex align-items-center gap-1">
                      {[1, 2, 3, 4, 5].map((star) => (
                        <FaStar
                          key={star}
                          size={18}
                          color={star <= complaint.feedback.rating ? '#F59E0B' : '#D1D5DB'}
                        />
                      ))}
                      <span className="ms-2 fw-bold text-dark">
                        {complaint.feedback.rating} / 5
                      </span>
                    </div>
                  ) : (
                    <span className="text-muted small fst-italic">No star rating submitted</span>
                  )}
                </div>

                <div className="mb-2">
                  <span className="text-muted fw-semibold small d-block mb-1">Citizen Feedback Comments:</span>
                  <div className="p-3 bg-light rounded border text-dark small" style={{ whiteSpace: 'pre-wrap' }}>
                    {complaint.feedback.comment || 'No written feedback comments provided.'}
                  </div>
                </div>

                {complaint.feedback.updated_at && (
                  <small className="text-muted d-block mt-2" style={{ fontSize: '0.8rem' }}>
                    Submitted on: {new Date(complaint.feedback.updated_at).toLocaleString()}
                  </small>
                )}
              </div>
            ) : (
              <div className="text-muted py-3 text-center bg-light rounded border">
                <p className="mb-0 small">No citizen feedback submitted yet (feedback is optional).</p>
              </div>
            )}
          </Card.Body>
        </Card>
      )}

      {/* Complaint Timeline */}
      <Card className="border-0 shadow-sm bg-light-blue mt-4">
        <Card.Body className="p-4">
          <h5 className="mb-4 fw-bold d-flex align-items-center">
            <FaHistory className="me-2 text-primary" /> Complaint Timeline
          </h5>
          <div className="timeline">
            {complaint.status_history && complaint.status_history.map((item, index) => {
              const itemStyle = getStatusBadgeStyle(item.status);
              return (
                <div key={index} className="timeline-item position-relative ps-4 pb-4">
                  {index !== complaint.status_history.length - 1 && (
                    <div
                      className="position-absolute bg-primary-blue"
                      style={{ left: '6px', top: '24px', bottom: 0, width: '2px', opacity: 0.2 }}
                    ></div>
                  )}
                  <div
                    className="position-absolute rounded-circle"
                    style={{ left: 0, top: '4px', width: '14px', height: '14px', backgroundColor: itemStyle.color }}
                  ></div>
                  <div>
                    <div className="d-flex justify-content-between align-items-start mb-1 flex-wrap gap-2">
                      <div className="d-flex align-items-center gap-2">
                        <span className="px-2 py-0.5 rounded-pill fw-semibold small" style={{ backgroundColor: itemStyle.bg, color: itemStyle.color, border: `1px solid ${itemStyle.border}` }}>
                          {item.status}
                        </span>
                        <span className="fw-bold text-dark">{item.action_label || item.status}</span>
                      </div>
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

      {/* Confirmation Modal for Rejecting Complaint */}
      <Modal show={showRejectModal} onHide={() => !rejecting && setShowRejectModal(false)} centered>
        <Modal.Header closeButton={!rejecting}>
          <Modal.Title className="fw-bold text-danger d-flex align-items-center">
            <FaBan className="me-2" /> Reject Complaint #{complaint.id}
          </Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <p className="text-muted small mb-3">
            Complaints can be rejected only while Pending and before assignment if they are invalid, duplicate, unverifiable, or outside municipal responsibility.
            A mandatory rejection reason is required and will be sent to the citizen.
          </p>

          {rejectModalError && (
            <Alert variant="danger" className="py-2 small">{rejectModalError}</Alert>
          )}

          <Form.Group className="mb-3">
            <Form.Label className="fw-bold text-dark">Reason for Rejection *</Form.Label>
            <Form.Select
              value={rejectCategory}
              onChange={(e) => setRejectCategory(e.target.value)}
              disabled={rejecting}
            >
              <option value="Duplicate complaint">Duplicate complaint</option>
              <option value="Invalid or unverifiable location">Invalid or unverifiable location</option>
              <option value="Outside municipal responsibility">Outside municipal responsibility</option>
              <option value="False or misleading information">False or misleading information</option>
              <option value="Other">Other</option>
            </Form.Select>
          </Form.Group>

          <Form.Group className="mb-3">
            <Form.Label className="fw-semibold text-dark small">
              {rejectCategory === 'Other' ? 'Mandatory Explanation *' : 'Additional Remarks / Explanation (Optional)'}
            </Form.Label>
            <Form.Control
              as="textarea"
              rows={3}
              placeholder={rejectCategory === 'Other' ? "Provide a clear, mandatory explanation for rejection..." : "Add any specific context for the citizen..."}
              value={customExplanation}
              onChange={(e) => setCustomExplanation(e.target.value)}
              disabled={rejecting}
              required={rejectCategory === 'Other'}
            />
          </Form.Group>
        </Modal.Body>
        <Modal.Footer>
          <Button
            variant="secondary"
            onClick={() => setShowRejectModal(false)}
            disabled={rejecting}
          >
            Cancel
          </Button>
          <Button
            variant="danger"
            onClick={handleConfirmReject}
            disabled={rejecting}
            className="d-flex align-items-center"
          >
            {rejecting ? <Spinner size="sm" className="me-2" /> : <FaBan className="me-2" />}
            Confirm Rejection
          </Button>
        </Modal.Footer>
      </Modal>

      {/* Verification Rejection Modal */}
      <Modal show={showVerifyRejectModal} onHide={() => !verifying && setShowVerifyRejectModal(false)} centered>
        <Modal.Header closeButton={!verifying}>
          <Modal.Title className="fw-bold text-danger d-flex align-items-center">
            <FaBan className="me-2" /> Reject Work Completion
          </Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <p className="text-muted small mb-3">
            Rejecting this work completion will return the complaint status to <strong>In Progress</strong>.
            A mandatory rejection reason is required and will be sent to the assigned department staff and citizen to guide rework.
          </p>

          {verifyError && <Alert variant="danger" className="py-2 small">{verifyError}</Alert>}

          <Form.Group className="mb-3">
            <Form.Label className="fw-bold text-dark">
              Rejection Reason & Required Rework <span className="text-danger">*</span>
            </Form.Label>
            <Form.Control
              as="textarea"
              rows={4}
              placeholder="Detail why the work was unsatisfactory and specify the required corrections..."
              value={verifyRejectReason}
              onChange={(e) => setVerifyRejectReason(e.target.value)}
              disabled={verifying}
              required
            />
          </Form.Group>
        </Modal.Body>
        <Modal.Footer>
          <Button
            variant="secondary"
            onClick={() => setShowVerifyRejectModal(false)}
            disabled={verifying}
          >
            Cancel
          </Button>
          <Button
            variant="danger"
            onClick={handleRejectVerification}
            disabled={verifying || !verifyRejectReason.trim()}
            className="d-flex align-items-center"
          >
            {verifying ? <Spinner size="sm" className="me-2" /> : <FaBan className="me-2" />}
            Confirm Rejection & Reopen
          </Button>
        </Modal.Footer>
      </Modal>
    </div>
  );
};

export default ComplaintDetails;
