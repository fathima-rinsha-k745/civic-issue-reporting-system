import React, { useState, useEffect } from 'react';
import { Row, Col, Card, Button, Table, Badge, Spinner } from 'react-bootstrap';
import { Link } from 'react-router-dom';
import { FaPlus, FaClipboardList, FaHourglassHalf, FaTools, FaCheckCircle } from 'react-icons/fa';
import { api } from '../../services/api';

const Dashboard = () => {
  const [stats, setStats] = useState({ total: 0, pending: 0, inProgress: 0, resolved: 0 });
  const [recentComplaints, setRecentComplaints] = useState([]);
  const [user, setUser] = useState(() => {
    try {
      const stored = localStorage.getItem('user');
      if (stored) {
        const parsed = JSON.parse(stored);
        const name = (parsed.full_name || parsed.fullName || parsed.name || parsed.first_name || parsed.username || '').trim();
        return { fullName: name };
      }
    } catch (_e) {}
    return { fullName: '' };
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        setLoading(true);
        const profile = await api.getProfile();
        if (profile) {
          setUser(profile);
        }
        
        const dashboardStats = await api.getDashboardStats();
        setStats(dashboardStats);
        
        const recent = await api.getRecentComplaints(5);
        setRecentComplaints(recent);
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
      case 'Awaiting Authority Verification':
      case 'Awaiting Citizen Confirmation': return <Badge bg="primary">Awaiting Authority Verification</Badge>;
      case 'Resolved': return <Badge bg="success">Resolved</Badge>;
      case 'Rejected': return <Badge bg="danger">Rejected</Badge>;
      default: return <Badge bg="secondary">{status}</Badge>;
    }
  };

  // Dynamic citizen name with graceful fallback to 'Citizen'
  const citizenName = (
    user?.fullName ||
    user?.full_name ||
    user?.name ||
    user?.first_name ||
    ''
  ).trim();

  const greetingName = citizenName && citizenName.toLowerCase() !== 'user'
    ? citizenName
    : 'Citizen';

  if (loading) {
    return (
      <div className="d-flex justify-content-center align-items-center" style={{ height: '50vh' }}>
        <Spinner animation="border" variant="primary" />
      </div>
    );
  }

  return (
    <div>
      <div className="d-flex justify-content-between align-items-center flex-wrap gap-3 mb-4">
        <div>
          <h2 className="mb-1 text-white fw-bold fs-3 fs-sm-2">Welcome Back, {greetingName}</h2>
          <p className="text-secondary mb-0">Track your complaints and stay updated on their progress.</p>
        </div>
        <Button as={Link} to="/dashboard/citizen/report" variant="primary" className="d-inline-flex align-items-center text-nowrap flex-shrink-0">
          <FaPlus className="me-2" /> Report a Civic Issue
        </Button>
      </div>

      {/* Summary Cards - Compact & Neatly Aligned in a Single Row */}
      <Row className="g-2 g-md-3 mb-4">
        <Col xs={6} md={3}>
          <div className="civic-stat-card py-3 px-2">
            <FaClipboardList size={20} className="text-primary mb-1 mx-auto" />
            <div className="civic-stat-value text-white">{stats.total}</div>
            <div className="civic-stat-label">Total Complaints</div>
          </div>
        </Col>
        <Col xs={6} md={3}>
          <div className="civic-stat-card py-3 px-2" style={{ borderBottom: '2px solid #F59E0B' }}>
            <FaHourglassHalf size={20} className="text-warning mb-1 mx-auto" />
            <div className="civic-stat-value text-warning">{stats.pending}</div>
            <div className="civic-stat-label">Pending</div>
          </div>
        </Col>
        <Col xs={6} md={3}>
          <div className="civic-stat-card py-3 px-2" style={{ borderBottom: '2px solid #06B6D4' }}>
            <FaTools size={20} className="text-info mb-1 mx-auto" />
            <div className="civic-stat-value text-info">{stats.inProgress}</div>
            <div className="civic-stat-label">In Progress</div>
          </div>
        </Col>
        <Col xs={6} md={3}>
          <div className="civic-stat-card py-3 px-2" style={{ borderBottom: '2px solid #10B981' }}>
            <FaCheckCircle size={20} className="text-success mb-1 mx-auto" />
            <div className="civic-stat-value text-success">{stats.resolved}</div>
            <div className="civic-stat-label">Resolved</div>
          </div>
        </Col>
      </Row>

      {/* Recent Complaints */}
      <Card className="border-0 shadow-sm">
        <Card.Header className="bg-white border-0 pt-4 pb-0">
          <h5 className="fw-bold mb-0">Recent Complaints</h5>
        </Card.Header>
        <Card.Body>
          {recentComplaints.length === 0 ? (
            <div className="text-center py-4 text-muted">
              <p>You haven't submitted any complaints yet.</p>
              <Button as={Link} to="/dashboard/citizen/report" variant="outline-blue" size="sm">
                Submit Your First Issue
              </Button>
            </div>
          ) : (
            <div className="table-responsive">
              <Table hover className="align-middle">
                <thead className="table-light">
                  <tr>
                    <th>Complaint ID</th>
                    <th>Status</th>
                    <th>Date</th>
                    <th>Action</th>
                  </tr>
                </thead>
                <tbody>
                  {recentComplaints.map((complaint) => (
                    <tr key={complaint.id}>
                      <td className="fw-medium">{complaint.id}</td>
                      <td>{getStatusBadge(complaint.status)}</td>
                      <td>{complaint.submittedDate}</td>
                      <td>
                        <Button 
                          as={Link} 
                          to={`/dashboard/citizen/complaints/${complaint.id}`}
                          variant="outline-secondary" 
                          size="sm"
                        >
                          View
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </Table>
            </div>
          )}
          
          {recentComplaints.length > 0 && (
            <div className="text-center mt-3">
              <Link to="/dashboard/citizen/complaints" className="text-primary-blue text-decoration-none fw-medium">
                View All Complaints &rarr;
              </Link>
            </div>
          )}
        </Card.Body>
      </Card>
    </div>
  );
};

export default Dashboard;
