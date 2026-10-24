import React, { useState, useEffect } from 'react';
import { Card, Form, InputGroup, Button, Table, Badge, Spinner, Row, Col } from 'react-bootstrap';
import { Link } from 'react-router-dom';
import { FaSearch, FaEye } from 'react-icons/fa';
import { api } from '../../services/api';

const StaffAssignedComplaints = () => {
  const [complaints, setComplaints] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('All');

  const [userProfile, setUserProfile] = useState(() => {
    try {
      const stored = localStorage.getItem('user');
      if (stored) return JSON.parse(stored);
    } catch (e) {}
    return {};
  });

  useEffect(() => {
    const fetchComplaints = async () => {
      try {
        setLoading(true);
        const [profileData, data] = await Promise.all([
          api.getProfile().catch(() => null),
          api.getMyComplaints()
        ]);
        if (profileData) setUserProfile(profileData);
        setComplaints(data || []);
      } catch (error) {
        console.error("Failed to load complaints", error);
      } finally {
        setLoading(false);
      }
    };
    
    fetchComplaints();
  }, []);

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

  // Filter complaints
  const filteredComplaints = complaints.filter(c => {
    const matchesSearch = 
      String(c.id).toLowerCase().includes(searchTerm.toLowerCase()) ||
      (c.description || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      (c.location || '').toLowerCase().includes(searchTerm.toLowerCase());
      
    const matchesStatus = statusFilter === 'All' || c.status === statusFilter;
    
    return matchesSearch && matchesStatus;
  });

  return (
    <div>
      <div className="mb-4">
        <h2 className="mb-1 text-white fw-bold fs-3 fs-sm-2">Assigned Complaints</h2>
        <p className="text-secondary mb-0">View assigned complaints, verify locations, and update resolution progress.</p>
      </div>

      <Card className="border-0 shadow-sm mb-4">
        <Card.Body className="p-3 p-sm-4">
          <Row className="g-2 g-sm-3 mb-4">
            <Col xs={12} md={8}>
              <InputGroup>
                <InputGroup.Text className="bg-white border-end-0">
                  <FaSearch className="text-muted" />
                </InputGroup.Text>
                <Form.Control
                  placeholder="Search assigned tasks by ID, description, or location..."
                  className="border-start-0 ps-0"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </InputGroup>
            </Col>
            <Col xs={12} md={4}>
              <Form.Select 
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
              >
                <option value="All">All Statuses</option>
                <option value="Pending">Pending</option>
                <option value="In Progress">In Progress</option>
                <option value="Awaiting Citizen Confirmation">Awaiting Citizen Confirmation</option>
                <option value="Resolved">Resolved</option>
                <option value="Rejected">Rejected</option>
              </Form.Select>
            </Col>
          </Row>

          {loading ? (
            <div className="text-center py-5">
              <Spinner animation="border" variant="primary" />
            </div>
          ) : filteredComplaints.length === 0 ? (
            <div className="text-center py-5 text-muted bg-light rounded">
              <p className="mb-0">No assigned complaints found matching your criteria.</p>
            </div>
          ) : (
            <>
              <div className="d-none d-md-block">
                {/* Desktop Table View */}
                <div className="table-responsive">
                  <Table hover className="align-middle border">
                    <thead className="table-light">
                      <tr>
                        <th>Complaint ID</th>
                        <th>Description</th>
                        <th>Location</th>
                        <th>Status</th>
                        <th>Assigned Team</th>
                        <th>Completion Remarks</th>
                        <th>Action</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredComplaints.map((c) => (
                        <tr key={c.id}>
                          <td className="fw-medium">{c.id}</td>
                          <td>
                            <div className="text-truncate" style={{ maxWidth: '200px' }}>
                              {c.description}
                            </div>
                          </td>
                          <td>
                            <div className="text-truncate" style={{ maxWidth: '160px' }}>
                              {c.location}
                            </div>
                          </td>
                          <td>{getStatusBadge(c.status)}</td>
                          <td>
                            {c.assigned_staff_members && c.assigned_staff_members.length > 0 ? (
                              <div className="d-flex flex-wrap gap-1" style={{ maxWidth: '200px' }}>
                                {c.assigned_staff_members.map((a, i) => {
                                  const sEmail = a.staff_email || a.email;
                                  const sName = a.staff_name || a.name || sEmail;
                                  const isYou = sEmail && sEmail === userProfile.email;
                                  return (
                                    <Badge 
                                      key={i} 
                                      bg={isYou ? "primary" : "secondary"}
                                      className="fw-normal"
                                    >
                                      {sName} {isYou && '(You)'}
                                    </Badge>
                                  );
                                })}
                              </div>
                            ) : (
                              <span className="text-muted small">None</span>
                            )}
                          </td>
                          <td>
                            {c.latest_completion?.completion_remarks ? (
                              <div className="text-truncate text-secondary small" style={{ maxWidth: '180px' }} title={c.latest_completion.completion_remarks}>
                                {c.latest_completion.completion_remarks}
                              </div>
                            ) : (
                              <span className="text-muted small">—</span>
                            )}
                          </td>
                          <td>
                            <Button 
                              as={Link} 
                              to={`/dashboard/department_staff/complaints/${c.id}`}
                              variant={c.status === 'Pending' ? 'primary' : 'outline-primary'} 
                              size="sm"
                              className="d-flex align-items-center text-nowrap"
                            >
                              <FaEye className="me-1" /> {c.status === 'Pending' ? 'Start Work' : c.status === 'In Progress' ? 'Submit Completion' : 'View Task'}
                            </Button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </Table>
                </div>
              </div>

              {/* Mobile Card View */}
              <div className="d-block d-md-none">
                {filteredComplaints.map((c) => (
                  <Card key={c.id} className="mb-3 shadow-sm border">
                    <Card.Body className="p-3">
                      <div className="d-flex justify-content-between align-items-start mb-2 gap-2">
                        <span className="fw-bold text-dark fs-6">#{c.id}</span>
                        {getStatusBadge(c.status)}
                      </div>
                      <p className="mb-1 text-truncate text-dark small">{c.description}</p>
                      <p className="mb-2 text-muted small"><i className="bi bi-geo-alt me-1 text-danger"></i>{c.location}</p>
                      
                      {c.assigned_staff_members && c.assigned_staff_members.length > 0 && (
                        <div className="mb-2">
                          <small className="text-muted d-block mb-1">Assigned Team:</small>
                          <div className="d-flex flex-wrap gap-1">
                            {c.assigned_staff_members.map((a, i) => {
                              const sEmail = a.staff_email || a.email;
                              const sName = a.staff_name || a.name || sEmail;
                              const isYou = sEmail && sEmail === userProfile.email;
                              return (
                                <Badge 
                                  key={i} 
                                  bg={isYou ? "primary" : "secondary"}
                                  className="fw-normal"
                                >
                                  {sName} {isYou && '(You)'}
                                </Badge>
                              );
                            })}
                          </div>
                        </div>
                      )}

                      {c.latest_completion?.completion_remarks && (
                        <div className="mb-2 p-2 bg-light rounded small text-secondary">
                          <strong>Remarks:</strong> {c.latest_completion.completion_remarks}
                        </div>
                      )}

                      <div className="d-flex justify-content-between align-items-center mt-3 pt-2 border-top">
                        <small className="text-muted">{c.submittedDate}</small>
                        <Button 
                          as={Link} 
                          to={`/dashboard/department_staff/complaints/${c.id}`}
                          variant={c.status === 'Pending' ? 'primary' : 'outline-primary'} 
                          size="sm"
                          className="px-3"
                        >
                          {c.status === 'Pending' ? 'Start Work' : c.status === 'In Progress' ? 'Submit Completion' : 'View'}
                        </Button>
                      </div>
                    </Card.Body>
                  </Card>
                ))}
              </div>
            </>
          )}

        </Card.Body>
      </Card>
    </div>
  );
};

export default StaffAssignedComplaints;
