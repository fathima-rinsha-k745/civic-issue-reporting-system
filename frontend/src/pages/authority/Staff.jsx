import React, { useState, useEffect } from 'react';
import { Card, Table, Button, Modal, Form, Spinner, Alert, Badge } from 'react-bootstrap';
import { FaPlus, FaEdit, FaTrash } from 'react-icons/fa';
import { api } from '../../services/api';

const Staff = () => {
  const [staffList, setStaffList] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [loading, setLoading] = useState(true);
  
  const [showModal, setShowModal] = useState(false);
  const [formData, setFormData] = useState({ id: null, email: '', password: '', full_name: '', department_id: '', is_active: true });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  
  const [deptFilter, setDeptFilter] = useState('All');

  const fetchData = async () => {
    try {
      setLoading(true);
      const [staffData, deptsData] = await Promise.all([
        api.getStaff(),
        api.getDepartments()
      ]);
      setStaffList(staffData);
      setDepartments(deptsData);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleOpenModal = (staff = null) => {
    setError('');
    if (staff) {
      setFormData({ 
        id: staff.id, 
        email: staff.email, 
        password: '', // Leave blank for edit
        full_name: staff.full_name, 
        department_id: staff.department,
        is_active: staff.is_active 
      });
    } else {
      setFormData({ id: null, email: '', password: '', full_name: '', department_id: '', is_active: true });
    }
    setShowModal(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.department_id) {
      setError('Please select a department');
      return;
    }

    setSaving(true);
    setError('');
    try {
      if (formData.id) {
        const payload = { 
          department_id: formData.department_id,
          is_active: formData.is_active
        };
        await api.updateStaff(formData.id, payload);
      } else {
        if (!formData.email || !formData.password) {
          throw new Error("Email and password are required for new staff");
        }
        await api.addStaff({
          email: formData.email,
          password: formData.password,
          full_name: formData.full_name,
          department_id: formData.department_id,
          is_active: formData.is_active
        });
      }
      setShowModal(false);
      fetchData();
    } catch (err) {
      setError(err.message || 'Failed to save staff member');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id) => {
    if (window.confirm('Are you sure you want to delete this staff member? This will completely remove their account.')) {
      try {
        await api.deleteStaff(id);
        fetchData();
      } catch (err) {
        alert('Failed to delete staff member');
      }
    }
  };

  const filteredStaff = deptFilter === 'All' 
    ? staffList 
    : staffList.filter(s => String(s.department) === String(deptFilter));

  return (
    <div>
      <div className="d-flex justify-content-between align-items-center mb-4 flex-wrap gap-3">
        <h2 className="mb-0 text-dark fw-bold">Manage Staff</h2>
        <div className="d-flex gap-3">
          <Form.Select value={deptFilter} onChange={(e) => setDeptFilter(e.target.value)} style={{ width: '200px' }}>
            <option value="All">All Departments</option>
            {departments.map(d => (
              <option key={d.id} value={d.id}>{d.name}</option>
            ))}
          </Form.Select>
          <Button variant="primary" onClick={() => handleOpenModal()} className="d-flex align-items-center flex-shrink-0">
            <FaPlus className="me-2" /> Add Staff
          </Button>
        </div>
      </div>

      <Card className="border-0 shadow-sm">
        <Card.Body className="p-0">
          {loading ? (
            <div className="text-center py-5"><Spinner animation="border" variant="primary" /></div>
          ) : filteredStaff.length === 0 ? (
            <div className="text-center py-5 text-muted">No staff found.</div>
          ) : (
            <div className="table-responsive">
              <Table hover className="align-middle mb-0">
                <thead className="table-light">
                  <tr>
                    <th className="px-4 py-3">Name</th>
                    <th className="px-4 py-3">Email</th>
                    <th className="px-4 py-3">Department</th>
                    <th className="px-4 py-3">Status</th>
                    <th className="px-4 py-3 text-end">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredStaff.map(s => (
                    <tr key={s.id}>
                      <td className="px-4 fw-medium text-dark">{s.full_name}</td>
                      <td className="px-4 text-muted">{s.email}</td>
                      <td className="px-4 fw-semibold text-dark">{s.department_name}</td>
                      <td className="px-4">
                        {s.is_active ? <Badge bg="success">Active</Badge> : <Badge bg="danger">Inactive</Badge>}
                      </td>
                      <td className="px-4 text-end">
                        <Button variant="outline-primary" size="sm" className="me-2" onClick={() => handleOpenModal(s)}>
                          <FaEdit />
                        </Button>
                        <Button variant="outline-danger" size="sm" onClick={() => handleDelete(s.id)}>
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
            <Modal.Title>{formData.id ? 'Edit Staff Member' : 'Add Staff Member'}</Modal.Title>
          </Modal.Header>
          <Modal.Body>
            {error && <Alert variant="danger">{error}</Alert>}
            
            <Form.Group className="mb-3">
              <Form.Label className="fw-bold">Full Name *</Form.Label>
              <Form.Control 
                type="text" 
                value={formData.full_name}
                onChange={(e) => setFormData({ ...formData, full_name: e.target.value })}
                required
                disabled={!!formData.id} // Name locked for edits as per typical auth, or we could add endpoint support
              />
            </Form.Group>

            <Form.Group className="mb-3">
              <Form.Label className="fw-bold">Email Address *</Form.Label>
              <Form.Control 
                type="email" 
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                required
                disabled={!!formData.id} // Cannot edit email once created
              />
            </Form.Group>

            {!formData.id && (
              <Form.Group className="mb-3">
                <Form.Label className="fw-bold">Password *</Form.Label>
                <Form.Control 
                  type="password" 
                  value={formData.password}
                  onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                  required={!formData.id}
                />
              </Form.Group>
            )}

            <Form.Group className="mb-3">
              <Form.Label className="fw-bold">Assign Department *</Form.Label>
              <Form.Select 
                value={formData.department_id}
                onChange={(e) => setFormData({ ...formData, department_id: e.target.value })}
                required
              >
                <option value="">-- Select Department --</option>
                {departments.map(d => (
                  <option key={d.id} value={d.id}>{d.name}</option>
                ))}
              </Form.Select>
            </Form.Group>

            {formData.id && (
              <Form.Group className="mb-3">
                <Form.Check 
                  type="switch"
                  id="active-switch"
                  label="Active Account"
                  checked={formData.is_active}
                  onChange={(e) => setFormData({ ...formData, is_active: e.target.checked })}
                />
              </Form.Group>
            )}

          </Modal.Body>
          <Modal.Footer>
            <Button variant="outline-secondary" onClick={() => setShowModal(false)}>Cancel</Button>
            <Button variant="primary" type="submit" disabled={saving}>
              {saving ? <Spinner size="sm" /> : 'Save Staff'}
            </Button>
          </Modal.Footer>
        </Form>
      </Modal>
    </div>
  );
};

export default Staff;
