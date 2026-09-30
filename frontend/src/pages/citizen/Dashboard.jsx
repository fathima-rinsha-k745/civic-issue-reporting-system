import React, { useState, useEffect } from 'react';
import { Row, Col, Card, Button, Table, Badge, Spinner } from 'react-bootstrap';
import { Link } from 'react-router-dom';
import { FaPlus, FaClipboardList, FaHourglassHalf, FaTools, FaCheckCircle } from 'react-icons/fa';
import { api } from '../../services/api';

const Dashboard = () => {
  const [stats, setStats] = useState({ total: 0, pending: 0, inProgress: 0, resolved: 0 });
  const [recentComplaints, setRecentComplaints] = useState([]);
  const [user, setUser] = useState({ fullName: 'Citizen' });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        setLoading(true);
        const profile = await api.getProfile();
        setUser(profile);
        
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
      case 'Resolved': return <Badge bg="success">Resolved</Badge>;
      case 'Rejected': return <Badge bg="danger">Rejected</Badge>;
      default: return <Badge bg="secondary">{status}</Badge>;
    }
  };

  if (loading) {
    return (
      <div className="d-flex justify-content-center align-items-center" style={{ height: '50vh' }}>
        <Spinner animation="border" variant="primary" />
      </div>
    );
  }

  return (
    <div>
      <div className="d-flex justify-content-between align-items-center mb-4">
        <div>
          <h2 className="mb-0">Welcome, {user.fullName}</h2>
          <p className="text-muted">Here is an overview of your civic issue reports.</p>
        </div>
        <Button as={Link} to="/dashboard/citizen/report" variant="primary-blue" className="d-flex align-items-center">
          <FaPlus className="me-2" /> Report a Civic Issue
        </Button>
      </div>

      {/* Summary Cards */}
      <Row className="mb-5 g-4">
        <Col md={3} sm={6}>
          <Card className="border-0 shadow-sm h-100 text-center py-3">
            <Card.Body>
              <FaClipboardList size={30} className="text-primary-blue mb-2" />
              <h3 className="fw-bold mb-0">{stats.total}</h3>
              <p className="text-muted mb-0">Total Complaints</p>
            </Card.Body>
          </Card>
        </Col>
        <Col md={3} sm={6}>
          <Card className="border-0 shadow-sm h-100 text-center py-3">
            <Card.Body>
              <FaHourglassHalf size={30} className="text-warning mb-2" />
              <h3 className="fw-bold mb-0">{stats.pending}</h3>
              <p className="text-muted mb-0">Pending</p>
            </Card.Body>
          </Card>
        </Col>
        <Col md={3} sm={6}>
          <Card className="border-0 shadow-sm h-100 text-center py-3">
            <Card.Body>
              <FaTools size={30} className="text-info mb-2" />
              <h3 className="fw-bold mb-0">{stats.inProgress}</h3>
              <p className="text-muted mb-0">In Progress</p>
            </Card.Body>
          </Card>
        </Col>
        <Col md={3} sm={6}>
          <Card className="border-0 shadow-sm h-100 text-center py-3">
            <Card.Body>
              <FaCheckCircle size={30} className="text-success mb-2" />
              <h3 className="fw-bold mb-0">{stats.resolved}</h3>
              <p className="text-muted mb-0">Resolved</p>
            </Card.Body>
          </Card>
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
