import React, { useState, useEffect } from 'react';
import { Card, Form, InputGroup, Button, Table, Badge, Spinner, Row, Col } from 'react-bootstrap';
import { Link } from 'react-router-dom';
import { FaSearch, FaEye } from 'react-icons/fa';
import { api } from '../../services/api';

const MyComplaints = () => {
  const [complaints, setComplaints] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('All');

  useEffect(() => {
    const fetchComplaints = async () => {
      try {
        setLoading(true);
        const data = await api.getMyComplaints();
        setComplaints(data);
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
      case 'Resolved': return <Badge bg="success">Resolved</Badge>;
      case 'Rejected': return <Badge bg="danger">Rejected</Badge>;
      default: return <Badge bg="secondary">{status}</Badge>;
    }
  };

  // Filter complaints
  const filteredComplaints = complaints.filter(c => {
    const matchesSearch = 
      c.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
      c.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
      c.location.toLowerCase().includes(searchTerm.toLowerCase());
      
    const matchesStatus = statusFilter === 'All' || c.status === statusFilter;
    
    return matchesSearch && matchesStatus;
  });

  return (
    <div>
      <div className="d-flex justify-content-between align-items-center mb-4">
        <h2 className="mb-0">My Complaints</h2>
      </div>

      <Card className="border-0 shadow-sm mb-4">
        <Card.Body className="p-4">
          <Row className="g-3 mb-4">
            <Col md={8}>
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
            <Col md={4}>
              <Form.Select 
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
              >
                <option value="All">All Statuses</option>
                <option value="Pending">Pending</option>
                <option value="In Progress">In Progress</option>
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
              <p className="mb-0">No complaints found matching your criteria.</p>
            </div>
          ) : (
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
                      <th>Date</th>
                      <th>Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredComplaints.map((c) => (
                      <tr key={c.id}>
                        <td className="fw-medium">{c.id}</td>
                        <td>
                          <div className="text-truncate" style={{ maxWidth: '250px' }}>
                            {c.description}
                          </div>
                        </td>
                        <td>{c.location}</td>
                        <td>{getStatusBadge(c.status)}</td>
                        <td>{c.submittedDate}</td>
                        <td>
                          <Button 
                            as={Link} 
                            to={`/dashboard/citizen/complaints/${c.id}`}
                            variant="outline-blue" 
                            size="sm"
                            className="d-flex align-items-center"
                          >
                            <FaEye className="me-1" /> View
                          </Button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </Table>
              </div>
            </div>
          )}

          {/* Mobile Card View */}
          <div className="d-block d-md-none">
            {filteredComplaints.map((c) => (
              <Card key={c.id} className="mb-3 shadow-sm border-0">
                <Card.Body>
                  <div className="d-flex justify-content-between align-items-center mb-2">
                    <span className="fw-bold">{c.id}</span>
                    {getStatusBadge(c.status)}
                  </div>
                  <p className="mb-1 text-truncate">{c.description}</p>
                  <p className="mb-2 text-muted small"><i className="bi bi-geo-alt me-1"></i>{c.location}</p>
                  <div className="d-flex justify-content-between align-items-center mt-3 pt-3 border-top">
                    <small className="text-muted">{c.submittedDate}</small>
                    <Button 
                      as={Link} 
                      to={`/dashboard/citizen/complaints/${c.id}`}
                      variant="outline-blue" 
                      size="sm"
                    >
                      View Details
                    </Button>
                  </div>
                </Card.Body>
              </Card>
            ))}
          </div>

        </Card.Body>
      </Card>
    </div>
  );
};

export default MyComplaints;
