import React, { useState } from 'react';
import { Container, Row, Col, Form, Button, Card, Alert } from 'react-bootstrap';
import { FaPhoneAlt, FaEnvelope, FaMapMarkerAlt } from 'react-icons/fa';

const Contact = () => {
  const [formData, setFormData] = useState({
    fullName: '',
    email: '',
    subject: '',
    message: ''
  });
  const [errors, setErrors] = useState({});
  const [submitMessage, setSubmitMessage] = useState('');

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: '' }));
    }
  };

  const validateForm = () => {
    const newErrors = {};
    if (!formData.fullName.trim()) newErrors.fullName = 'Required';
    if (!formData.email.trim()) {
      newErrors.email = 'Required';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = 'Invalid email';
    }
    if (!formData.subject.trim()) newErrors.subject = 'Required';
    if (!formData.message.trim()) newErrors.message = 'Required';

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    setSubmitMessage('');

    if (validateForm()) {
      setSubmitMessage('Backend submission is not yet configured. Message not sent.');
    }
  };

  return (
    <div style={{ 
      minHeight: 'calc(100vh - 76px)',
      backgroundImage: 'linear-gradient(rgba(11, 27, 61, 0.7), rgba(11, 27, 61, 0.7)), url(/hero-civic.jpg)',
      backgroundSize: 'cover',
      backgroundPosition: 'center',
      backgroundAttachment: 'fixed',
      padding: '40px 0'
    }}>
      <Container>
        <div className="text-center mb-5 pt-3">
          <h1 className="fs-main-heading text-white text-shadow-sm mb-2">Contact CivicConnect</h1>
          <p className="fs-body-text text-light mx-auto" style={{ maxWidth: '600px', opacity: 0.9 }}>
            Reach out with any questions, feedback, or concerns regarding the platform.
          </p>
        </div>

        <Row className="g-4 justify-content-center">
          <Col lg={6}>
            <Card className="border-0 glass-card glass-card-dark-text h-100">
              <Card.Body className="p-4">
                <h3 className="fs-section-heading mb-4 border-bottom border-light pb-2">Send a Message</h3>
                {submitMessage && <Alert variant="warning" className="fs-body-text p-2 mb-3">{submitMessage}</Alert>}
                <Form onSubmit={handleSubmit}>
                  <Row className="g-3">
                    <Col md={6}>
                      <Form.Group controlId="fullName">
                        <Form.Label className="fs-form-label mb-1">Full Name</Form.Label>
                        <Form.Control
                          type="text"
                          name="fullName"
                          value={formData.fullName}
                          onChange={handleChange}
                          isInvalid={!!errors.fullName}
                          placeholder="Your Name"
                          size="sm"
                          className="glass-input"
                        />
                      </Form.Group>
                    </Col>
                    <Col md={6}>
                      <Form.Group controlId="email">
                        <Form.Label className="fs-form-label mb-1">Email Address</Form.Label>
                        <Form.Control
                          type="email"
                          name="email"
                          value={formData.email}
                          onChange={handleChange}
                          isInvalid={!!errors.email}
                          placeholder="email@example.com"
                          size="sm"
                          className="glass-input"
                        />
                      </Form.Group>
                    </Col>
                    <Col md={12}>
                      <Form.Group controlId="subject">
                        <Form.Label className="fs-form-label mb-1">Subject</Form.Label>
                        <Form.Control
                          type="text"
                          name="subject"
                          value={formData.subject}
                          onChange={handleChange}
                          isInvalid={!!errors.subject}
                          placeholder="Subject"
                          size="sm"
                          className="glass-input"
                        />
                      </Form.Group>
                    </Col>
                    <Col md={12}>
                      <Form.Group controlId="message">
                        <Form.Label className="fs-form-label mb-1">Message</Form.Label>
                        <Form.Control
                          as="textarea"
                          rows={4}
                          name="message"
                          value={formData.message}
                          onChange={handleChange}
                          isInvalid={!!errors.message}
                          placeholder="Your message..."
                          size="sm"
                          className="glass-input"
                        />
                      </Form.Group>
                    </Col>
                    <Col md={12} className="mt-4">
                      <Button variant="primary" type="submit" size="sm" className="w-100 fw-bold">
                        Submit
                      </Button>
                    </Col>
                  </Row>
                </Form>
              </Card.Body>
            </Card>
          </Col>

          <Col lg={4}>
            <Card className="border-0 glass-card glass-card-dark-text h-100">
              <Card.Body className="p-4 d-flex flex-column justify-content-center">
                <h3 className="fs-section-heading mb-4 border-bottom border-light pb-2">Contact Information</h3>
                
                <div className="d-flex align-items-start mb-4">
                  <div className="me-3 mt-1 text-light">
                    <FaMapMarkerAlt size={18} />
                  </div>
                  <div>
                    <h5 className="fs-card-heading mb-1">Office Address</h5>
                    <p className="fs-body-text mb-0 opacity-75">
                      [Municipal Office Address Placeholder]
                    </p>
                  </div>
                </div>

                <div className="d-flex align-items-start mb-4">
                  <div className="me-3 mt-1 text-light">
                    <FaPhoneAlt size={18} />
                  </div>
                  <div>
                    <h5 className="fs-card-heading mb-1">Phone Number</h5>
                    <p className="fs-body-text mb-0 opacity-75">
                      [Phone Number Placeholder]
                    </p>
                  </div>
                </div>

                <div className="d-flex align-items-start">
                  <div className="me-3 mt-1 text-light">
                    <FaEnvelope size={18} />
                  </div>
                  <div>
                    <h5 className="fs-card-heading mb-1">Email Address</h5>
                    <p className="fs-body-text mb-0 opacity-75">
                      [Email Address Placeholder]
                    </p>
                  </div>
                </div>

              </Card.Body>
            </Card>
          </Col>
        </Row>
      </Container>
    </div>
  );
};

export default Contact;
