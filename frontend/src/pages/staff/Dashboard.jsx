import React, { useState, useEffect } from 'react';
import { Card, Button, Table, Badge, Spinner, Row, Col } from 'react-bootstrap';
import { Link } from 'react-router-dom';
import { FaEye, FaEnvelope } from 'react-icons/fa';
import { api } from '../../services/api';

const StaffDashboard = () => {
  const [complaints, setComplaints] = useState([]);
  const [loading, setLoading] = useState(true);
  const [userProfile, setUserProfile] = useState(() => {
    try {
      const stored = localStorage.getItem('user');
      if (stored) {
        const u = JSON.parse(stored);
        return {
          fullName: u.full_name || 'Staff Member',
          email: u.email || '',
          department: u.department || '',
          role: u.role || 'DEPARTMENT_STAFF'
        };
      }
    } catch (e) {}
    return { fullName: 'Staff Member', email: '', department: '', role: 'DEPARTMENT_STAFF' };
  });

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        setLoading(true);
        const [profileData, complaintsData] = await Promise.all([
          api.getProfile().catch(() => null),
          api.getMyComplaints()
        ]);
        if (profileData && profileData.fullName) {
          setUserProfile(profileData);
        }
        setComplaints(complaintsData || []);
      } catch (error) {
        console.error("Failed to load dashboard data", error);
      } finally {
        setLoading(false);
      }
    };
    
    fetchDashboardData();
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

  // Recent complaints
  const recentComplaints = complaints.slice(0, 5);

  const total = complaints.length;
  const pending = complaints.filter(c => c.status === 'Pending').length;
  const inProgress = complaints.filter(c => c.status === 'In Progress').length;
  const awaitingConfirmation = complaints.filter(c => c.status === 'Awaiting Citizen Confirmation').length;
  const resolved = complaints.filter(c => c.status === 'Resolved').length;

  return (
    <div>
      {/* Page Header */}
      <div className="d-flex flex-column flex-md-row justify-content-between align-items-start align-items-md-center gap-3 mb-4">
        <div>
          <h2 className="mb-1 text-white fw-bold fs-3 fs-sm-2">
            Welcome Back, {userProfile.fullName || 'Staff Member'}
          </h2>
          <p className="text-secondary mb-0">View assigned complaints and update their progress.</p>
        </div>
        <div className="d-flex align-items-center gap-2">
          <Badge bg="primary" className="px-3 py-2 fw-medium text-uppercase">
            {userProfile.department || 'Assigned Department'}
          </Badge>
          <Button 
            as={Link} 
            to="/dashboard/department_staff/profile" 
            variant="outline-primary" 
            size="sm"
            className="fw-medium"
          >
            View Profile
          </Button>
        </div>
      </div>

      {/* Summary Cards - Compact & Neatly Aligned in a Single Row */}
      <Row className="g-2 g-md-3 mb-4">
        <Col xs={6} md>
          <div className="civic-stat-card py-3 px-2">
            <div className="civic-stat-value text-white">{total}</div>
            <div className="civic-stat-label">Total Assigned</div>
          </div>
        </Col>
        <Col xs={6} md>
          <div className="civic-stat-card py-3 px-2" style={{ borderBottom: '2px solid #F59E0B' }}>
            <div className="civic-stat-value text-warning">{pending}</div>
            <div className="civic-stat-label">Pending</div>
          </div>
        </Col>
        <Col xs={6} md>
          <div className="civic-stat-card py-3 px-2" style={{ borderBottom: '2px solid #06B6D4' }}>
            <div className="civic-stat-value text-info">{inProgress}</div>
            <div className="civic-stat-label">In Progress</div>
          </div>
        </Col>
        <Col xs={6} md>
          <div className="civic-stat-card py-3 px-2" style={{ borderBottom: '2px solid #8B5CF6' }}>
            <div className="civic-stat-value text-primary">{awaitingConfirmation}</div>
            <div className="civic-stat-label">Awaiting Citizen</div>
          </div>
        </Col>
        <Col xs={12} md>
          <div className="civic-stat-card py-3 px-2" style={{ borderBottom: '2px solid #10B981' }}>
            <div className="civic-stat-value text-success">{resolved}</div>
            <div className="civic-stat-label">Resolved</div>
          </div>
        </Col>
      </Row>

      <div className="d-flex flex-column flex-sm-row justify-content-between align-items-start align-items-sm-center gap-2 mb-4">
        <h3 className="mb-0 text-white fw-bold fs-4 fs-sm-3">Recent Assigned Complaints</h3>
        <Button 
          as={Link} 
          to="/dashboard/department_staff/complaints" 
          variant="outline-primary"
          size="sm"
          className="w-100 w-sm-auto"
        >
          View All Complaints
        </Button>
      </div>

      <Card className="border-0 shadow-sm mb-4">
        <Card.Body className="p-3 p-sm-4">
          {loading ? (
            <div className="text-center py-5">
              <Spinner animation="border" variant="primary" />
            </div>
          ) : recentComplaints.length === 0 ? (
            <div className="text-center py-5 text-muted bg-light rounded">
              <p className="mb-0">No assigned complaints found.</p>
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
                    {recentComplaints.map((c) => (
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
                            variant="outline-primary" 
                            size="sm"
                            className="d-flex align-items-center"
                          >
                            <FaEye className="me-1" /> View / Update
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
                {recentComplaints.map((c) => (
                  <Card key={c.id} className="mb-3 shadow-sm border">
                    <Card.Body className="p-3">
                      <div className="d-flex justify-content-between align-items-start mb-2 gap-2">
                        <span className="fw-bold text-dark fs-6">#{c.id}</span>
                        {getStatusBadge(c.status)}
                      </div>
                      <p className="mb-1 text-truncate text-dark small">{c.description}</p>
                      <p className="mb-2 text-muted small"><i className="bi bi-geo-alt me-1"></i>{c.location}</p>
                      
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
                          variant="outline-primary" 
                          size="sm"
                          className="px-3"
                        >
                          Update
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

export default StaffDashboard;
