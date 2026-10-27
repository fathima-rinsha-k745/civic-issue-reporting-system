import React, { useState, useEffect } from 'react';
import { Card, Row, Col, Spinner, Table, Badge, Button } from 'react-bootstrap';
import { Link } from 'react-router-dom';
import { api } from '../../services/api';
import { FaInbox, FaSpinner, FaCheckCircle, FaTimesCircle, FaUserSlash, FaEye } from 'react-icons/fa';
import AnalyticsSection from '../../components/authority/AnalyticsSection';

const Dashboard = () => {
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    total: 0, pending: 0, inProgress: 0, resolved: 0, rejected: 0, unassigned: 0
  });
  const [recent, setRecent] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [allComplaints, setAllComplaints] = useState([]);

  useEffect(() => {
    const fetchDashboard = async () => {
      try {
        setLoading(true);
        const [complaints, depts] = await Promise.all([
          api.getMyComplaints(),
          api.getDepartments().catch(() => [])
        ]);
        
        setAllComplaints(complaints);
        
        const s = {
          total: complaints.length,
          pending: complaints.filter(c => c.status === 'Pending').length,
          inProgress: complaints.filter(c => c.status === 'In Progress').length,
          resolved: complaints.filter(c => c.status === 'Resolved').length,
          rejected: complaints.filter(c => c.status === 'Rejected').length,
          unassigned: complaints.filter(c => !c.department).length,
        };
        setStats(s);
        setRecent(complaints.slice(0, 5));
        
        // Count complaints per dept
        const deptCounts = depts.map(d => ({
          ...d,
          count: complaints.filter(c => c.department === d.id || c.department_name === d.name).length
        }));
        setDepartments(deptCounts);
      } catch (err) {
        console.error("Error loading dashboard", err);
      } finally {
        setLoading(false);
      }
    };
    fetchDashboard();
  }, []);

  if (loading) {
    return <div className="text-center py-5"><Spinner animation="border" variant="primary" /></div>;
  }

  const getStatusBadge = (status) => {
    switch(status) {
      case 'Pending': return <Badge bg="warning" text="dark">Pending</Badge>;
      case 'In Progress': return <Badge bg="info">In Progress</Badge>;
      case 'Resolved': return <Badge bg="success">Resolved</Badge>;
      case 'Rejected': return <Badge bg="danger">Rejected</Badge>;
      default: return <Badge bg="secondary">{status}</Badge>;
    }
  };

  return (
    <div>
      {/* Page Header */}
      <div className="mb-4">
        <h2 className="mb-1 text-white fw-bold fs-3 fs-sm-2">Welcome Back, Municipal Authority</h2>
        <p className="text-secondary mb-0">Here is an overview of complaints and municipal activities.</p>
      </div>
      
      {/* Summary Cards - Compact & Neatly Aligned in a Single Row */}
      <Row className="g-2 g-md-3 mb-4">
        <Col xs={6} sm={4} lg={2}>
          <div className="civic-stat-card py-3 px-2">
            <div className="civic-stat-value text-white">{stats.total}</div>
            <div className="civic-stat-label">Total Complaints</div>
          </div>
        </Col>
        <Col xs={6} sm={4} lg={2}>
          <div className="civic-stat-card py-3 px-2" style={{ borderBottom: '2px solid #F59E0B' }}>
            <FaInbox className="text-warning mb-1 mx-auto" size={18} />
            <div className="civic-stat-value text-warning">{stats.pending}</div>
            <div className="civic-stat-label">Pending</div>
          </div>
        </Col>
        <Col xs={6} sm={4} lg={2}>
          <div className="civic-stat-card py-3 px-2" style={{ borderBottom: '2px solid #06B6D4' }}>
            <FaSpinner className="text-info mb-1 mx-auto" size={18} />
            <div className="civic-stat-value text-info">{stats.inProgress}</div>
            <div className="civic-stat-label">In Progress</div>
          </div>
        </Col>
        <Col xs={6} sm={4} lg={2}>
          <div className="civic-stat-card py-3 px-2" style={{ borderBottom: '2px solid #10B981' }}>
            <FaCheckCircle className="text-success mb-1 mx-auto" size={18} />
            <div className="civic-stat-value text-success">{stats.resolved}</div>
            <div className="civic-stat-label">Resolved</div>
          </div>
        </Col>
        <Col xs={6} sm={4} lg={2}>
          <div className="civic-stat-card py-3 px-2" style={{ borderBottom: '2px solid #EF4444' }}>
            <FaTimesCircle className="text-danger mb-1 mx-auto" size={18} />
            <div className="civic-stat-value text-danger">{stats.rejected}</div>
            <div className="civic-stat-label">Rejected</div>
          </div>
        </Col>
        <Col xs={6} sm={4} lg={2}>
          <div className="civic-stat-card py-3 px-2" style={{ borderBottom: '2px solid #64748B' }}>
            <FaUserSlash className="text-secondary mb-1 mx-auto" size={18} />
            <div className="civic-stat-value text-secondary">{stats.unassigned}</div>
            <div className="civic-stat-label">Unassigned</div>
          </div>
        </Col>
      </Row>

      {/* Analytics Graphs Section */}
      <AnalyticsSection complaints={allComplaints} unassignedCount={stats.unassigned} />

      <Row className="g-4">
        {/* Recent Complaints */}
        <Col lg={8}>
          <Card className="border-0 shadow-sm h-100">
            <Card.Header className="bg-white border-bottom-0 pt-4 pb-0">
              <h5 className="fw-bold text-dark mb-0">Recent Complaints</h5>
            </Card.Header>
            <Card.Body>
              <div className="table-responsive">
                <Table hover className="align-middle">
                  <thead className="table-light">
                    <tr>
                      <th>ID</th>
                      <th>Description</th>
                      <th>Department</th>
                      <th>Status</th>
                      <th>Date</th>
                      <th>Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {recent.length === 0 ? (
                      <tr><td colSpan="6" className="text-center text-muted py-4">No recent complaints.</td></tr>
                    ) : recent.map(c => (
                      <tr key={c.id}>
                        <td className="fw-medium text-dark">{c.id}</td>
                        <td className="text-truncate" style={{ maxWidth: '150px' }}>{c.description}</td>
                        <td>{c.department_name || c.department || <span className="text-danger small">Unassigned</span>}</td>
                        <td>{getStatusBadge(c.status)}</td>
                        <td className="text-muted small">{c.submittedDate}</td>
                        <td>
                          <Button as={Link} to={`/dashboard/municipal_authority/complaints/${c.id}`} variant="outline-primary" size="sm">
                            <FaEye /> View
                          </Button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </Table>
              </div>
              <div className="text-end mt-2">
                <Button as={Link} to="/dashboard/municipal_authority/complaints" variant="link" className="text-decoration-none">
                  View All Complaints &rarr;
                </Button>
              </div>
            </Card.Body>
          </Card>
        </Col>

        {/* Department Overview */}
        <Col lg={4}>
          <Card className="border-0 shadow-sm h-100">
            <Card.Header className="bg-white border-bottom-0 pt-4 pb-0">
              <h5 className="fw-bold text-dark mb-0">Department Overview</h5>
            </Card.Header>
            <Card.Body>
              {departments.length === 0 ? (
                <p className="text-muted text-center py-4">No departments found.</p>
              ) : (
                <ul className="list-group list-group-flush">
                  {departments.map(d => (
                    <li key={d.id} className="list-group-item d-flex justify-content-between align-items-center px-0 border-0 mb-2">
                      <span className="fw-medium text-dark">{d.name}</span>
                      <Badge bg="primary" pill className="px-3">{d.count}</Badge>
                    </li>
                  ))}
                </ul>
              )}
            </Card.Body>
          </Card>
        </Col>
      </Row>
    </div>
  );
};

export default Dashboard;
