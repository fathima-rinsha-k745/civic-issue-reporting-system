import React, { useState, useEffect } from 'react';
import { Card, Form, InputGroup, Button, Table, Badge, Spinner, Row, Col, Modal, Alert } from 'react-bootstrap';
import { Link } from 'react-router-dom';
import { FaSearch, FaEye, FaBan, FaCheckCircle } from 'react-icons/fa';
import { api } from '../../services/api';

const Dashboard = () => {
  const [complaints, setComplaints] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('All');
  const [departmentFilter, setDepartmentFilter] = useState('All');

  // Rejection modal state
  const [selectedComplaint, setSelectedComplaint] = useState(null);
  const [showRejectModal, setShowRejectModal] = useState(false);
  const [rejectCategory, setRejectCategory] = useState('Duplicate complaint');
  const [customExplanation, setCustomExplanation] = useState('');
  const [rejectModalError, setRejectModalError] = useState('');
  const [rejecting, setRejecting] = useState(false);
  const [actionSuccess, setActionSuccess] = useState('');

  const fetchData = async () => {
    try {
      setLoading(true);
      const [complaintsData, deptsData] = await Promise.all([
        api.getMyComplaints(),
        api.getDepartments().catch(() => [])
      ]);
      setComplaints(complaintsData);
      setDepartments(deptsData);
    } catch (error) {
      console.error("Failed to load data", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const getStatusBadge = (status) => {
    switch(status) {
      case 'Pending': return <Badge bg="warning" text="dark">Pending</Badge>;
      case 'In Progress': return <Badge bg="info">In Progress</Badge>;
      case 'Awaiting Citizen Confirmation': return <Badge bg="primary">Awaiting Confirmation</Badge>;
      case 'Resolved': return <Badge bg="success">Resolved</Badge>;
      case 'Rejected': return <Badge bg="danger">Rejected</Badge>;
      default: return <Badge bg="secondary">{status}</Badge>;
    }
  };

  const isEligibleForRejection = (c) => {
    return c.status === 'Pending' && 
      (!c.department || c.department === 'Unassigned') && 
      (!c.assigned_staff_members || c.assigned_staff_members.length === 0) &&
      (!c.assigned_staff_ids || c.assigned_staff_ids.length === 0);
  };

  const handleOpenReject = (complaint) => {
    setSelectedComplaint(complaint);
    setRejectCategory('Duplicate complaint');
    setCustomExplanation('');
    setRejectModalError('');
    setShowRejectModal(true);
  };

  const handleConfirmReject = async () => {
    if (!selectedComplaint) return;

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
      const updated = await api.rejectComplaint(selectedComplaint.id, finalReason);
      setComplaints(prev => prev.map(c => c.id === updated.id ? updated : c));
      setShowRejectModal(false);
      setActionSuccess(`Complaint #${selectedComplaint.id} has been rejected successfully.`);
    } catch (err) {
      setRejectModalError(err.message || 'Failed to reject complaint.');
    } finally {
      setRejecting(false);
    }
  };

  const filteredComplaints = complaints.filter(c => {
    const matchesSearch = 
      String(c.id).toLowerCase().includes(searchTerm.toLowerCase()) ||
      (c.description || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      (c.location || '').toLowerCase().includes(searchTerm.toLowerCase());
      
    const matchesStatus = statusFilter === 'All' || c.status === statusFilter;
    const matchesDept = departmentFilter === 'All' || c.department === departmentFilter || c.department_name === departmentFilter;
    
    return matchesSearch && matchesStatus && matchesDept;
  });

  return (
    <div>
      <div className="mb-4">
        <h2 className="mb-1 text-white fw-bold fs-3 fs-sm-2">Manage Complaints</h2>
        <p className="text-secondary mb-0">Review, filter, and manage submitted civic complaints.</p>
      </div>

      {actionSuccess && (
        <Alert variant="success" dismissible onClose={() => setActionSuccess('')} className="mb-4">
          <FaCheckCircle className="me-2" />
          {actionSuccess}
        </Alert>
      )}

      <Card className="border-0 shadow-sm mb-4">
        <Card.Body className="p-4">
          <Row className="g-2 g-sm-3 mb-4">
            <Col xs={12} md={6}>
              <InputGroup>
                <InputGroup.Text className="bg-white border-end-0">
                  <FaSearch className="text-muted" />
                </InputGroup.Text>
                <Form.Control
                  placeholder="Search complaints by ID, description, or location..."
                  className="border-start-0 ps-0"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </InputGroup>
            </Col>
            <Col xs={6} md={3}>
              <Form.Select 
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
              >
                <option value="All">All Statuses</option>
                <option value="Pending">Pending</option>
                <option value="In Progress">In Progress</option>
                <option value="Awaiting Citizen Confirmation">Awaiting Confirmation</option>
                <option value="Resolved">Resolved</option>
                <option value="Rejected">Rejected</option>
              </Form.Select>
            </Col>
            <Col xs={6} md={3}>
              <Form.Select 
                value={departmentFilter}
                onChange={(e) => setDepartmentFilter(e.target.value)}
              >
                <option value="All">All Departments</option>
                <option value="Unassigned">Unassigned</option>
                {departments.map(d => (
                  <option key={d.id} value={d.name}>{d.name}</option>
                ))}
              </Form.Select>
            </Col>
          </Row>

          {loading ? (
            <div className="text-center py-5">
              <Spinner animation="border" variant="primary" />
            </div>
          ) : filteredComplaints.length === 0 ? (
            <div className="text-center py-5 text-muted bg-light rounded">
              <p className="mb-0">No complaints found matching your criteria.</p>
              <Button variant="link" onClick={() => { setSearchTerm(''); setStatusFilter('All'); setDepartmentFilter('All'); }}>Clear Filters</Button>
            </div>
          ) : (
            <>
              {/* Desktop Table View */}
              <div className="d-none d-md-block">
                <div className="table-responsive">
                  <Table hover className="align-middle border">
                    <thead className="table-light">
                      <tr>
                        <th>ID</th>
                        <th>Description</th>
                        <th>Location</th>
                        <th>Department</th>
                        <th>Status</th>
                        <th>Date</th>
                        <th style={{ minWidth: '220px' }}>Action</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredComplaints.map((c) => {
                        const eligibleForReject = isEligibleForRejection(c);
                        return (
                          <tr key={c.id}>
                            <td className="fw-medium">{c.id}</td>
                            <td>
                              <div className="text-truncate" style={{ maxWidth: '200px' }} title={c.description}>
                                {c.description}
                              </div>
                            </td>
                            <td>{c.location}</td>
                            <td>{c.department_name || c.department || 'Unassigned'}</td>
                            <td>{getStatusBadge(c.status)}</td>
                            <td>{c.submittedDate}</td>
                            <td>
                              <div className="d-flex gap-2 align-items-center">
                                {eligibleForReject ? (
                                  <>
                                    <Button 
                                      as={Link} 
                                      to={`/dashboard/municipal_authority/complaints/${c.id}`}
                                      variant="primary" 
                                      size="sm"
                                      className="d-flex align-items-center text-nowrap"
                                    >
                                      <FaEye className="me-1" /> Review & Assign
                                    </Button>
                                    <Button 
                                      variant="outline-danger" 
                                      size="sm"
                                      className="d-flex align-items-center text-nowrap"
                                      onClick={() => handleOpenReject(c)}
                                    >
                                      <FaBan className="me-1" /> Reject
                                    </Button>
                                  </>
                                ) : c.status === 'Rejected' ? (
                                  <Button 
                                    as={Link} 
                                    to={`/dashboard/municipal_authority/complaints/${c.id}`}
                                    variant="outline-secondary" 
                                    size="sm"
                                    className="d-flex align-items-center"
                                  >
                                    <FaEye className="me-1" /> View Details
                                  </Button>
                                ) : (
                                  <Button 
                                    as={Link} 
                                    to={`/dashboard/municipal_authority/complaints/${c.id}`}
                                    variant="outline-primary" 
                                    size="sm"
                                    className="d-flex align-items-center text-nowrap"
                                  >
                                    <FaEye className="me-1" /> View / Assign
                                  </Button>
                                )}
                              </div>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </Table>
                </div>
              </div>

              {/* Mobile Card View */}
              <div className="d-block d-md-none">
                {filteredComplaints.map((c) => {
                  const eligibleForReject = isEligibleForRejection(c);
                  return (
                    <Card key={c.id} className="mb-3 shadow-sm border">
                      <Card.Body className="p-3">
                        <div className="d-flex justify-content-between align-items-start mb-2 gap-2">
                          <div>
                            <span className="fw-bold text-dark fs-6">#{c.id}</span>
                            <small className="text-muted d-block">{c.submittedDate}</small>
                          </div>
                          <div>{getStatusBadge(c.status)}</div>
                        </div>

                        <p className="mb-2 text-dark small text-truncate" title={c.description}>
                          {c.description}
                        </p>

                        <div className="small text-muted mb-2">
                          <i className="bi bi-geo-alt me-1 text-danger"></i>
                          <span>{c.location}</span>
                        </div>

                        <div className="small text-secondary mb-3">
                          <span className="fw-semibold">Department:</span> {c.department_name || c.department || <span className="text-danger">Unassigned</span>}
                        </div>

                        <div className="pt-2 border-top">
                          {eligibleForReject ? (
                            <div className="d-flex gap-2">
                              <Button 
                                as={Link} 
                                to={`/dashboard/municipal_authority/complaints/${c.id}`}
                                variant="primary" 
                                size="sm"
                                className="flex-fill d-inline-flex align-items-center justify-content-center"
                              >
                                <FaEye className="me-1" /> Review & Assign
                              </Button>
                              <Button 
                                variant="outline-danger" 
                                size="sm"
                                className="d-inline-flex align-items-center justify-content-center px-3"
                                onClick={() => handleOpenReject(c)}
                              >
                                <FaBan className="me-1" /> Reject
                              </Button>
                            </div>
                          ) : c.status === 'Rejected' ? (
                            <Button 
                              as={Link} 
                              to={`/dashboard/municipal_authority/complaints/${c.id}`}
                              variant="outline-secondary" 
                              size="sm"
                              className="w-100 d-inline-flex align-items-center justify-content-center"
                            >
                              <FaEye className="me-1" /> View Details
                            </Button>
                          ) : (
                            <Button 
                              as={Link} 
                              to={`/dashboard/municipal_authority/complaints/${c.id}`}
                              variant="outline-primary" 
                              size="sm"
                              className="w-100 d-inline-flex align-items-center justify-content-center"
                            >
                              <FaEye className="me-1" /> View / Assign
                            </Button>
                          )}
                        </div>
                      </Card.Body>
                    </Card>
                  );
                })}
              </div>
            </>
          )}
        </Card.Body>
      </Card>

      {/* Rejection Modal for List */}
      <Modal show={showRejectModal} onHide={() => !rejecting && setShowRejectModal(false)} centered>
        <Modal.Header closeButton={!rejecting}>
          <Modal.Title className="fw-bold text-danger d-flex align-items-center">
            <FaBan className="me-2" /> Reject Complaint #{selectedComplaint?.id}
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

export default Dashboard;
