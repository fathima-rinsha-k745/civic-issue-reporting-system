// Real API functions hitting Django Backend

const mapComplaint = (c) => ({
  ...c,
  submittedDate: c.created_at ? c.created_at.split('T')[0] : 'N/A',
  lastUpdated: c.updated_at ? c.updated_at.split('T')[0] : 'N/A',
  photo: c.image,
  department: c.department_name || 'Unassigned',
});

export const api = {
  // Get dashboard summary
  getDashboardStats: async () => {
    try {
      const response = await fetch('/api/complaints/');
      if (!response.ok) throw new Error('Failed to fetch stats');
      const rawComplaints = await response.json();
      const complaints = rawComplaints.map(mapComplaint);
      
      return {
        total: complaints.length,
        pending: complaints.filter(c => c.status === 'Pending').length,
        inProgress: complaints.filter(c => c.status === 'In Progress').length,
        resolved: complaints.filter(c => c.status === 'Resolved').length,
      };
    } catch (error) {
      console.error(error);
      return { total: 0, pending: 0, inProgress: 0, resolved: 0 };
    }
  },

  // Get recent complaints for dashboard
  getRecentComplaints: async (limit = 5) => {
    try {
      const response = await fetch('/api/complaints/');
      if (!response.ok) throw new Error('Failed to fetch recent complaints');
      const rawComplaints = await response.json();
      const complaints = rawComplaints.map(mapComplaint);
      return complaints.slice(0, limit);
    } catch (error) {
      console.error(error);
      return [];
    }
  },

  // Get all complaints for citizen or authority
  getMyComplaints: async () => {
    const response = await fetch('/api/complaints/');
    if (!response.ok) throw new Error('Failed to fetch complaints');
    const data = await response.json();
    return data.map(mapComplaint);
  },

  // Get complaint details by ID
  getComplaintDetails: async (id) => {
    const response = await fetch(`/api/complaints/${id}/`);
    if (!response.ok) throw new Error('Complaint not found');
    const data = await response.json();
    
    // We should also fetch history if available, but for now just mock or use from data
    return {
       ...mapComplaint(data),
       history: data.status_history || [{ status: data.status, remarks: 'Status update', date: mapComplaint(data).lastUpdated }]
    };
  },

  // Submit a new complaint
  submitComplaint: async (data) => {
    const response = await fetch('/api/complaints/', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        description: data.description,
        location: data.location,
        category: 'Other', // Required by current model CATEGORY_CHOICES, though prompt says do not add Category table, the field is there on the model
        photo: data.photo || null,
      }),
    });
    if (!response.ok) throw new Error('Failed to submit complaint');
    const respData = await response.json();
    return mapComplaint(respData);
  },

  // Get user profile
  getProfile: async () => {
    try {
      const response = await fetch('/api/profile/');
      if (response.ok) {
        const data = await response.json();
        // Update local storage with fresh data
        const localUser = JSON.parse(localStorage.getItem('user') || '{}');
        localStorage.setItem('user', JSON.stringify({ ...localUser, email: data.email, full_name: data.full_name, role: data.role }));
        return {
          fullName: data.full_name,
          email: data.email,
          role: data.role
        };
      }
    } catch (e) {
      console.error(e);
    }
    // Fallback to local storage
    const user = JSON.parse(localStorage.getItem('user') || '{}');
    return {
      fullName: user.full_name || 'User',
      email: user.email || 'user@example.com',
      role: user.role || 'CITIZEN'
    };
  },

  // Update user profile
  updateProfile: async (data) => {
    const response = await fetch('/api/profile/', {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(data),
    });
    if (!response.ok) {
      const errData = await response.json().catch(() => ({}));
      throw new Error(errData.error || 'Failed to update profile');
    }
    const respData = await response.json();
    
    // Update local storage with fresh data
    const localUser = JSON.parse(localStorage.getItem('user') || '{}');
    localStorage.setItem('user', JSON.stringify({ ...localUser, email: respData.email, full_name: respData.full_name, role: respData.role }));
    
    return {
      fullName: respData.full_name,
      email: respData.email,
      role: respData.role,
      message: respData.message
    };
  },

  // Get Departments
  getDepartments: async () => {
    const response = await fetch('/api/departments/');
    if (!response.ok) throw new Error('Failed to fetch departments');
    return await response.json();
  },
  addDepartment: async (data) => {
    const response = await fetch('/api/departments/', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    if (!response.ok) throw new Error('Failed to add department');
    return await response.json();
  },
  updateDepartment: async (id, data) => {
    const response = await fetch(`/api/departments/${id}/`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    if (!response.ok) throw new Error('Failed to update department');
    return await response.json();
  },
  deleteDepartment: async (id) => {
    const response = await fetch(`/api/departments/${id}/`, { method: 'DELETE' });
    if (!response.ok) throw new Error('Failed to delete department');
    return true;
  },

  // Get Staff
  getStaff: async () => {
    const response = await fetch('/api/staff/');
    if (!response.ok) throw new Error('Failed to fetch staff');
    return await response.json();
  },
  addStaff: async (data) => {
    const response = await fetch('/api/staff/', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    if (!response.ok) throw new Error('Failed to add staff');
    return await response.json();
  },
  updateStaff: async (id, data) => {
    const response = await fetch(`/api/staff/${id}/`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    if (!response.ok) throw new Error('Failed to update staff');
    return await response.json();
  },
  deleteStaff: async (id) => {
    const response = await fetch(`/api/staff/${id}/`, { method: 'DELETE' });
    if (!response.ok) throw new Error('Failed to delete staff');
    return true;
  },

  // Update Complaint
  updateComplaint: async (id, data) => {
    const response = await fetch(`/api/complaints/${id}/`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(data),
    });
    if (!response.ok) throw new Error('Failed to update complaint');
    const respData = await response.json();
    return mapComplaint(respData);
  }
};

