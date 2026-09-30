import React, { useState, useEffect } from 'react';
import { Card, Table, Button, Modal, Form, Spinner, Alert } from 'react-bootstrap';
import { FaPlus, FaEdit, FaTrash } from 'react-icons/fa';
import { api } from '../../services/api';

const Departments = () => {
  const [departments, setDepartments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [formData, setFormData] = useState({ id: null, name: '' });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const fetchDepartments = async () => {
    try {
      setLoading(true);
      const data = await api.getDepartments();
      setDepartments(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDepartments();
  }, []);

  const handleOpenModal = (dept = null) => {
    setError('');
    if (dept) {
      setFormData({ id: dept.id, name: dept.name });
    } else {
      setFormData({ id: null, name: '' });
    }
    setShowModal(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.name.trim()) {
      setError('Department name is required');
      return;
    }
    
    // Check duplicates locally
    const duplicate = departments.find(d => d.name.toLowerCase() === formData.name.trim().toLowerCase() && d.id !== formData.id);
    if (duplicate) {
      setError('Department name already exists');
      return;
    }

    setSaving(true);
    setError('');
    try {
      if (formData.id) {
        await api.updateDepartment(formData.id, { name: formData.name });
      } else {
        await api.addDepartment({ name: formData.name });
      }
      setShowModal(false);
      fetchDepartments();
    } catch (err) {
      setError('Failed to save department');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id) => {
    if (window.confirm('Are you sure you want to delete this department?')) {
      try {
        await api.deleteDepartment(id);
        fetchDepartments();
      } catch (err) {
        alert('Failed to delete department');
      }
    }
  };

  return (
    <div>
      <div className="d-flex justify-content-between align-items-center mb-4">
        <h2 className="mb-0 text-dark fw-bold">Manage Departments</h2>
        <Button variant="primary" onClick={() => handleOpenModal()} className="d-flex align-items-center">
          <FaPlus className="me-2" /> Add Department
        </Button>
      </div>

      <Card className="border-0 shadow-sm">
        <Card.Body className="p-0">
          {loading ? (
            <div className="text-center py-5"><Spinner animation="border" variant="primary" /></div>
          ) : departments.length === 0 ? (
            <div className="text-center py-5 text-muted">No departments found.</div>
          ) : (
            <div className="table-responsive">
              <Table hover className="align-middle mb-0">
                <thead className="table-light">
                  <tr>
                    <th className="px-4 py-3">ID</th>
                    <th className="px-4 py-3">Department Name</th>
                    <th className="px-4 py-3">Assigned Complaints</th>
                    <th className="px-4 py-3 text-end">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {departments.map(d => (
                    <tr key={d.id}>
                      <td className="px-4 fw-medium text-dark">{d.id}</td>
                      <td className="px-4 text-dark fw-semibold">{d.name}</td>
                      <td className="px-4">{d.complaints_count || 0}</td>
                      <td className="px-4 text-end">
                        <Button variant="outline-primary" size="sm" className="me-2" onClick={() => handleOpenModal(d)}>
                          <FaEdit />
                        </Button>
                        <Button variant="outline-danger" size="sm" onClick={() => handleDelete(d.id)}>
                          <FaTrash />
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

      <Modal show={showModal} onHide={() => setShowModal(false)} centered>
        <Form onSubmit={handleSubmit}>
          <Modal.Header closeButton>
            <Modal.Title>{formData.id ? 'Edit Department' : 'Add Department'}</Modal.Title>
          </Modal.Header>
          <Modal.Body>
            {error && <Alert variant="danger">{error}</Alert>}
            <Form.Group>
              <Form.Label className="fw-bold">Department Name *</Form.Label>
              <Form.Control 
                type="text" 
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="Enter department name"
                required
              />
            </Form.Group>
          </Modal.Body>
          <Modal.Footer>
            <Button variant="outline-secondary" onClick={() => setShowModal(false)}>Cancel</Button>
            <Button variant="primary" type="submit" disabled={saving}>
              {saving ? <Spinner size="sm" /> : 'Save'}
            </Button>
          </Modal.Footer>
        </Form>
      </Modal>
    </div>
  );
};

export default Departments;
