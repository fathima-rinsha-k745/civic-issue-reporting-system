import React, { useState, useEffect } from 'react';
import { Card, Form, InputGroup, Button, Table, Badge, Spinner, Row, Col } from 'react-bootstrap';
import { Link } from 'react-router-dom';
import { FaSearch, FaEye } from 'react-icons/fa';
import { api } from '../../services/api';

const Dashboard = () => {
  const [complaints, setComplaints] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('All');
  const [departmentFilter, setDepartmentFilter] = useState('All');

  useEffect(() => {
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
    
    fetchData();
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
      <div className="d-flex justify-content-between align-items-center mb-4">
        <h2 className="mb-0 text-dark fw-bold">View Complaints</h2>
      </div>

      <Card className="border-0 shadow-sm mb-4">
        <Card.Body className="p-4">
          <Row className="g-3 mb-4">
            <Col md={6}>
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
            <Col md={3}>
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
            <Col md={3}>
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
                      <td>{c.location}</td>
                      <td>{c.department_name || c.department || 'Unassigned'}</td>
                      <td>{getStatusBadge(c.status)}</td>
                      <td>{c.submittedDate}</td>
                      <td>
                        <Button 
                          as={Link} 
                          to={`/dashboard/municipal_authority/complaints/${c.id}`}
                          variant="outline-primary" 
                          size="sm"
                          className="d-flex align-items-center"
                        >
                          <FaEye className="me-1" /> View / Assign
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </Table>
            </div>
          )}
        </Card.Body>
      </Card>
    </div>
  );
};

export default Dashboard;
