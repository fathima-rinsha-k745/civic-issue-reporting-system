// Real API functions hitting Django Backend
const API_BASE_URL = '';

const originalFetch = window.fetch;
const fetch = (url, options = {}) => {
  return originalFetch(url, { ...options, credentials: 'include' });
};

const mapComplaint = (c) => {
  const mappedHistory = (c.status_history || []).map(h => ({
    ...h,
    date: h.date || (h.updated_at ? h.updated_at.split('T')[0] : 'N/A'),
    updated_by_name: h.updated_by_name || 'System',
    updated_by_role: h.updated_by_role || null,
    action_label: h.action_label || null
  }));
  return {
    ...c,
    submittedDate: c.created_at ? c.created_at.split('T')[0] : 'N/A',
    lastUpdated: c.updated_at ? c.updated_at.split('T')[0] : 'N/A',
    photo: c.image,
    department: c.department_name || (typeof c.department === 'string' ? c.department : 'Unassigned'),
    assigned_staff_members: c.assigned_staff_members || [],
    assigned_staff_ids: c.assigned_staff_ids || [],
    latest_completion: c.latest_completion || null,
    completions: c.completions || [],
    status_history: mappedHistory,
    history: mappedHistory,
    rejection_reason: c.rejection_reason || null,
    rejected_by_name: c.rejected_by_name || null,
    rejected_at_formatted: c.rejected_at_formatted || null
  };
};

export const api = {
  // Get Municipal Authority Analytics
  getAnalytics: async (days = 7) => {
    const response = await fetch(`${API_BASE_URL}/api/analytics/?days=${days}`);
    if (!response.ok) {
      let errorMsg = 'Failed to fetch analytics data';
      try {
        const err = await response.json();
        if (err.error) errorMsg = err.error;
      } catch (_e) {}
      throw new Error(errorMsg);
    }
    return await response.json();
  },

  // Get dashboard summary
  getDashboardStats: async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/complaints/`);
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
      const response = await fetch(`${API_BASE_URL}/api/complaints/`);
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
    const response = await fetch(`${API_BASE_URL}/api/complaints/`);
    if (!response.ok) throw new Error('Failed to fetch complaints');
    const data = await response.json();
    return data.map(mapComplaint);
  },

  // Get complaint details by ID
  getComplaintDetails: async (id) => {
    const response = await fetch(`${API_BASE_URL}/api/complaints/${id}/`);
    if (!response.ok) throw new Error('Complaint not found');
    const data = await response.json();
    
    return {
       ...mapComplaint(data),
       history: (data.status_history && data.status_history.length > 0)
         ? data.status_history.map(h => ({
             ...h,
             status: h.status,
             remarks: h.remarks,
             date: h.date || (h.updated_at ? h.updated_at.split('T')[0] : 'N/A'),
             updated_at: h.updated_at,
             updated_by_name: h.updated_by_name || 'System',
             updated_by_role: h.updated_by_role || null,
             action_label: h.action_label || null
           }))
         : [{ status: data.status, remarks: 'Status update', date: mapComplaint(data).lastUpdated, updated_by_name: 'System', updated_by_role: null, action_label: 'Status update' }]
    };
  },

  // Submit a new complaint
  submitComplaint: async (data) => {
    const formData = new FormData();
    formData.append('description', data.description);
    formData.append('location', data.location);
    formData.append('category', 'Other'); // Required by model
    if (data.latitude !== undefined && data.latitude !== null && data.latitude !== '') {
      formData.append('latitude', data.latitude);
    }
    if (data.longitude !== undefined && data.longitude !== null && data.longitude !== '') {
      formData.append('longitude', data.longitude);
    }
    if (data.photo) {
      formData.append('image', data.photo);
    }

    const response = await fetch(`${API_BASE_URL}/api/complaints/`, {
      method: 'POST',
      body: formData,
    });
    if (!response.ok) {
      let errorMessage = 'Failed to submit complaint';
      try {
        const errData = await response.json();
        // Extract the first error message if it's an object
        if (typeof errData === 'object' && errData !== null) {
          const firstKey = Object.keys(errData)[0];
          errorMessage = `${firstKey}: ${errData[firstKey]}`;
        } else if (errData.detail) {
          errorMessage = errData.detail;
        }
      } catch (e) {
        const text = await response.text();
        console.error('Submit error:', text);
      }
      throw new Error(errorMessage);
    }
    const respData = await response.json();
    return mapComplaint(respData);
  },

  // Get user profile
  getProfile: async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/profile/`);
      if (response.ok) {
        const data = await response.json();
        // Update local storage with fresh data
        const localUser = JSON.parse(localStorage.getItem('user') || '{}');
        localStorage.setItem('user', JSON.stringify({ ...localUser, email: data.email, full_name: data.full_name, role: data.role, department: data.department }));
        return {
          fullName: data.full_name,
          email: data.email,
          role: data.role,
          department: data.department
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
      role: user.role || 'CITIZEN',
      department: user.department || null
    };
  },

  // Update user profile
  updateProfile: async (data) => {
    const response = await fetch(`${API_BASE_URL}/api/profile/`, {
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
    const response = await fetch(`${API_BASE_URL}/api/departments/`);
    if (!response.ok) throw new Error('Failed to fetch departments');
    return await response.json();
  },
  addDepartment: async (data) => {
    const response = await fetch(`${API_BASE_URL}/api/departments/`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    if (!response.ok) throw new Error('Failed to add department');
    return await response.json();
  },
  updateDepartment: async (id, data) => {
    const response = await fetch(`${API_BASE_URL}/api/departments/${id}/`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    if (!response.ok) throw new Error('Failed to update department');
    return await response.json();
  },
  deleteDepartment: async (id) => {
    const response = await fetch(`${API_BASE_URL}/api/departments/${id}/`, { method: 'DELETE' });
    if (!response.ok) throw new Error('Failed to delete department');
    return true;
  },

  // Get Staff
  getStaff: async () => {
    const response = await fetch(`${API_BASE_URL}/api/staff/`);
    if (!response.ok) throw new Error('Failed to fetch staff');
    return await response.json();
  },
  addStaff: async (data) => {
    const response = await fetch(`${API_BASE_URL}/api/staff/`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    if (!response.ok) {
      let errMsg = 'Failed to add staff';
      try {
        const errData = await response.json();
        if (typeof errData === 'string') errMsg = errData;
        else if (Array.isArray(errData)) errMsg = errData.join(', ');
        else if (errData && typeof errData === 'object') {
          const keys = Object.keys(errData);
          errMsg = Array.isArray(errData[keys[0]]) ? errData[keys[0]].join(', ') : errData[keys[0]];
        }
      } catch (_e) {}
      throw new Error(errMsg);
    }
    return await response.json();
  },
  updateStaff: async (id, data) => {
    const response = await fetch(`${API_BASE_URL}/api/staff/${id}/`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    if (!response.ok) throw new Error('Failed to update staff');
    return await response.json();
  },
  deleteStaff: async (id) => {
    const response = await fetch(`${API_BASE_URL}/api/staff/${id}/`, { method: 'DELETE' });
    if (!response.ok) throw new Error('Failed to delete staff');
    return true;
  },

  // Update Complaint
  updateComplaint: async (id, data) => {
    const response = await fetch(`${API_BASE_URL}/api/complaints/${id}/`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(data),
    });
    if (!response.ok) {
      const err = await response.json().catch(() => ({}));
      throw new Error(err.error || err.detail || 'Failed to update complaint');
    }
    const respData = await response.json();
    return mapComplaint(respData);
  },

  // Authority reject complaint
  rejectComplaint: async (id, rejection_reason) => {
    const response = await fetch(`${API_BASE_URL}/api/complaints/${id}/reject/`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ rejection_reason }),
    });
    if (!response.ok) {
      const err = await response.json().catch(() => ({}));
      throw new Error(err.error || err.detail || 'Failed to reject complaint');
    }
    const respData = await response.json();
    return respData.complaint ? mapComplaint(respData.complaint) : mapComplaint(respData);
  },

  // Staff start work on assigned complaint
  startWork: async (id) => {
    const response = await fetch(`${API_BASE_URL}/api/complaints/${id}/start-work/`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
    });
    if (!response.ok) {
      const err = await response.json().catch(() => ({}));
      throw new Error(err.error || err.detail || 'Failed to start work on complaint');
    }
    const respData = await response.json();
    return respData.complaint ? mapComplaint(respData.complaint) : mapComplaint(respData);
  },

  // Staff mark work as completed
  submitCompletion: async (id, data) => {
    const response = await fetch(`${API_BASE_URL}/api/complaints/${id}/complete/`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(data),
    });
    if (!response.ok) {
      const err = await response.json().catch(() => ({}));
      throw new Error(err.error || err.detail || 'Failed to submit completion remarks');
    }
    const respData = await response.json();
    return respData.complaint ? mapComplaint(respData.complaint) : respData;
  },

  // Citizen confirm resolution
  citizenConfirmResolution: async (id, data = {}) => {
    const response = await fetch(`${API_BASE_URL}/api/complaints/${id}/citizen-confirm/`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ action: 'confirm', ...data }),
    });
    if (!response.ok) {
      const err = await response.json().catch(() => ({}));
      throw new Error(err.error || err.detail || 'Failed to confirm resolution');
    }
    const respData = await response.json();
    return respData.complaint ? mapComplaint(respData.complaint) : respData;
  },

  // Citizen report not fixed
  citizenRejectResolution: async (id, data = {}) => {
    const response = await fetch(`${API_BASE_URL}/api/complaints/${id}/citizen-confirm/`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ action: 'reject', ...data }),
    });
    if (!response.ok) {
      const err = await response.json().catch(() => ({}));
      throw new Error(err.error || err.detail || 'Failed to report issue as not fixed');
    }
    const respData = await response.json();
    return respData.complaint ? mapComplaint(respData.complaint) : respData;
  },

  // Notifications
  getNotifications: async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/notifications/`);
      if (!response.ok) return [];
      return await response.json();
    } catch (e) {
      return [];
    }
  },

  markNotificationRead: async (id) => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/notifications/${id}/read/`, {
        method: 'POST',
      });
      return response.ok;
    } catch (e) {
      return false;
    }
  },

  markAllNotificationsRead: async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/notifications/read-all/`, {
        method: 'POST',
      });
      return response.ok;
    } catch (e) {
      return false;
    }
  },

  getUnreadNotificationCount: async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/notifications/unread-count/`);
      if (!response.ok) return 0;
      const data = await response.json();
      return data.unread_count || 0;
    } catch (e) {
      return 0;
    }
  }
};

