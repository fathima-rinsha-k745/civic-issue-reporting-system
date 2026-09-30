import React, { useState, useEffect } from 'react';
import { Card, Badge, Spinner, Row, Col, Button } from 'react-bootstrap';
import { useParams, Link } from 'react-router-dom';
import { FaArrowLeft, FaMapMarkerAlt, FaCalendarAlt, FaTag, FaBuilding } from 'react-icons/fa';
import { api } from '../../services/api';

const ComplaintDetails = () => {
  const { id } = useParams();
  const [complaint, setComplaint] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchComplaint = async () => {
      try {
        setLoading(true);
        const data = await api.getComplaintDetails(id);
        setComplaint(data);
      } catch (err) {
        setError('Complaint not found or you do not have permission to view it.');
      } finally {
        setLoading(false);
      }
    };
    
    fetchComplaint();
  }, [id]);

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
      <div className="text-center py-5">
        <Spinner animation="border" variant="primary" />
      </div>
    );
  }

  if (error || !complaint) {
    return (
      <div className="text-center py-5">
        <h4 className="text-danger mb-3">{error || 'Complaint not found'}</h4>
        <Button as={Link} to="/dashboard/citizen/complaints" variant="outline-blue">
          Back to My Complaints
        </Button>
      </div>
    );
  }

  return (
    <div>
      <div className="mb-4">
        <Button 
          as={Link} 
          to="/dashboard/citizen/complaints" 
          variant="link" 
          className="text-decoration-none text-muted px-0 mb-2 d-inline-flex align-items-center"
        >
          <FaArrowLeft className="me-2" /> Back to list
        </Button>
        <div className="d-flex justify-content-between align-items-center flex-wrap gap-2">
          <h2 className="mb-0">Complaint {complaint.id}</h2>
          {getStatusBadge(complaint.status)}
        </div>
      </div>

      <Row className="g-4">
        {/* Main Details */}
        <Col lg={8}>
          <Card className="border-0 shadow-sm h-100">
            <Card.Body className="p-4 p-md-5">
              <h5 className="border-bottom pb-2 mb-4">Description</h5>
              <p className="mb-5" style={{ whiteSpace: 'pre-wrap' }}>
                {complaint.description}
              </p>

              <h5 className="border-bottom pb-2 mb-4">Details</h5>
              <Row className="g-4">
                <Col sm={6}>
                  <div className="d-flex align-items-start text-muted">
                    <FaMapMarkerAlt className="mt-1 me-3 fs-5 text-primary-blue" />
                    <div>
                      <small className="d-block text-uppercase fw-bold">Location</small>
                      <span className="text-dark">{complaint.location}</span>
                    </div>
                  </div>
                </Col>

                <Col sm={6}>
                  <div className="d-flex align-items-start text-muted">
                    <FaBuilding className="mt-1 me-3 fs-5 text-primary-blue" />
                    <div>
                      <small className="d-block text-uppercase fw-bold">Assigned Department</small>
                      <span className="text-dark">{complaint.department}</span>
                    </div>
                  </div>
                </Col>
                <Col sm={6}>
                  <div className="d-flex align-items-start text-muted">
                    <FaCalendarAlt className="mt-1 me-3 fs-5 text-primary-blue" />
                    <div>
                      <small className="d-block text-uppercase fw-bold">Submitted Date</small>
                      <span className="text-dark">{complaint.submittedDate}</span>
                    </div>
                  </div>
                </Col>
              </Row>

              {complaint.photo && (
                <div className="mt-5">
                  <h5 className="border-bottom pb-2 mb-4">Photo</h5>
                  <img src={complaint.photo} alt="Issue" className="img-fluid rounded border" />
                </div>
              )}
            </Card.Body>
          </Card>
        </Col>

        {/* Status History Timeline */}
        <Col lg={4}>
          <Card className="border-0 shadow-sm h-100 bg-light-blue">
            <Card.Body className="p-4">
              <h5 className="mb-4">Status History</h5>
              
              <div className="timeline">
                {complaint.history && complaint.history.map((item, index) => (
                  <div key={index} className="timeline-item position-relative ps-4 pb-4">
                    {/* Timeline Line */}
                    {index !== complaint.history.length - 1 && (
                      <div 
                        className="position-absolute bg-primary-blue" 
                        style={{ left: '6px', top: '24px', bottom: 0, width: '2px', opacity: 0.2 }}
                      ></div>
                    )}
                    
                    {/* Timeline Dot */}
                    <div 
                      className="position-absolute bg-primary-blue rounded-circle" 
                      style={{ left: 0, top: '4px', width: '14px', height: '14px' }}
                    ></div>
                    
                    {/* Content */}
                    <div>
                      <div className="d-flex justify-content-between align-items-start mb-1">
                        <span className="fw-bold text-dark">{item.status}</span>
                      </div>
                      <p className="text-muted small mb-1">{item.remarks}</p>
                      <small className="text-secondary" style={{ fontSize: '0.75rem' }}>{item.date}</small>
                    </div>
                  </div>
                ))}
              </div>
            </Card.Body>
          </Card>
        </Col>
      </Row>
    </div>
  );
};

export default ComplaintDetails;
