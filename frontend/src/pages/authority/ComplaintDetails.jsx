import React, { useState, useEffect } from 'react';
import { Card, Badge, Spinner, Button, Row, Col, Form, Alert, Modal } from 'react-bootstrap';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { api } from '../../services/api';
import LocationDisplay from '../../components/common/LocationDisplay';
import { FaUserCheck, FaArrowLeft, FaUsers, FaBan, FaCheckCircle, FaHistory } from 'react-icons/fa';

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

  // Rejection modal state
  const [showRejectModal, setShowRejectModal] = useState(false);
  const [rejectCategory, setRejectCategory] = useState('Duplicate complaint');
  const [customExplanation, setCustomExplanation] = useState('');
  const [rejectModalError, setRejectModalError] = useState('');
  const [rejecting, setRejecting] = useState(false);

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

  const getStatusBadgeStyle = (status) => {
    switch (status) {
      case 'Resolved':
        return { bg: '#d1e7dd', color: '#0f5132' };
      case 'In Progress':
        return { bg: '#cfe2ff', color: '#084298' };
      case 'Awaiting Citizen Confirmation':
        return { bg: '#e2d9f3', color: '#59359a' };
      case 'Rejected':
        return { bg: '#f8d7da', color: '#842029' };
      case 'Pending':
      default:
        return { bg: '#fff3cd', color: '#856404' };
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
        <h3 className="fw-bold mb-1 text-dark">Complaint Review & Assignment</h3>
        <p className="text-muted fs-6">Review complaint details, verify location, and allocate to department staff.</p>
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
              <h5 className="alert-heading fw-bold mb-1">Complaint Resolved</h5>
              <p className="mb-0 text-dark">
                This complaint has been confirmed as resolved by the citizen.
              </p>
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
                        {complaint.latest_completion.citizen_response !== 'Pending' && (
                          <div className="mt-2 pt-2 border-top">
                            <small className="d-block text-muted">
                              Citizen Response: <strong>{complaint.latest_completion.citizen_response}</strong> ({complaint.latest_completion.responded_at_formatted || ''})
                            </small>
                            {complaint.latest_completion.citizen_remarks && (
                              <small className="text-secondary fst-italic">
                                Remarks: "{complaint.latest_completion.citizen_remarks}"
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
                        <span className="px-2 py-0.5 rounded-pill fw-semibold small" style={{ backgroundColor: itemStyle.bg, color: itemStyle.color }}>
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
    </div>
  );
};

export default ComplaintDetails;
