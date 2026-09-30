import React, { useState, useEffect } from 'react';
import { Card, Row, Col, Spinner, Table, Badge, Button } from 'react-bootstrap';
import { Link } from 'react-router-dom';
import { api } from '../../services/api';
import { FaInbox, FaSpinner, FaCheckCircle, FaTimesCircle, FaUserSlash, FaEye } from 'react-icons/fa';

const Dashboard = () => {
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    total: 0, pending: 0, inProgress: 0, resolved: 0, rejected: 0, unassigned: 0
  });
  const [recent, setRecent] = useState([]);
  const [departments, setDepartments] = useState([]);

  useEffect(() => {
    const fetchDashboard = async () => {
      try {
        setLoading(true);
        const [complaints, depts] = await Promise.all([
          api.getMyComplaints(),
          api.getDepartments().catch(() => [])
        ]);
        
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
      <h2 className="mb-4 text-dark fw-bold">Dashboard Summary</h2>
      
      {/* Summary Cards */}
      <Row className="g-4 mb-4">
        <Col md={4} lg={2} xs={6}>
          <Card className="border-0 shadow-sm text-center h-100 py-3">
            <h1 className="display-5 fw-bold text-dark mb-0">{stats.total}</h1>
            <span className="text-muted small fw-semibold">Total Complaints</span>
          </Card>
        </Col>
        <Col md={4} lg={2} xs={6}>
          <Card className="border-0 shadow-sm text-center h-100 py-3" style={{ borderBottom: '4px solid #ffc107' }}>
            <FaInbox className="text-warning mb-2 mx-auto" size={24} />
            <h3 className="fw-bold text-dark mb-0">{stats.pending}</h3>
            <span className="text-muted small fw-semibold">Pending</span>
          </Card>
        </Col>
        <Col md={4} lg={2} xs={6}>
          <Card className="border-0 shadow-sm text-center h-100 py-3" style={{ borderBottom: '4px solid #0dcaf0' }}>
            <FaSpinner className="text-info mb-2 mx-auto" size={24} />
            <h3 className="fw-bold text-dark mb-0">{stats.inProgress}</h3>
            <span className="text-muted small fw-semibold">In Progress</span>
          </Card>
        </Col>
        <Col md={4} lg={2} xs={6}>
          <Card className="border-0 shadow-sm text-center h-100 py-3" style={{ borderBottom: '4px solid #198754' }}>
            <FaCheckCircle className="text-success mb-2 mx-auto" size={24} />
            <h3 className="fw-bold text-dark mb-0">{stats.resolved}</h3>
            <span className="text-muted small fw-semibold">Resolved</span>
          </Card>
        </Col>
        <Col md={4} lg={2} xs={6}>
          <Card className="border-0 shadow-sm text-center h-100 py-3" style={{ borderBottom: '4px solid #dc3545' }}>
            <FaTimesCircle className="text-danger mb-2 mx-auto" size={24} />
            <h3 className="fw-bold text-dark mb-0">{stats.rejected}</h3>
            <span className="text-muted small fw-semibold">Rejected</span>
          </Card>
        </Col>
        <Col md={4} lg={2} xs={6}>
          <Card className="border-0 shadow-sm text-center h-100 py-3" style={{ borderBottom: '4px solid #6c757d' }}>
            <FaUserSlash className="text-secondary mb-2 mx-auto" size={24} />
            <h3 className="fw-bold text-dark mb-0">{stats.unassigned}</h3>
            <span className="text-muted small fw-semibold">Unassigned</span>
          </Card>
        </Col>
      </Row>

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
