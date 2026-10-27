// Real API functions hitting Django Backend
const API_BASE_URL = '';

const originalFetch = window.fetch;
const fetch = (url, options = {}) => {
  return originalFetch(url, { ...options, credentials: 'include' });
};

const mapComplaint = (c) => {
  const rawCitizen = (c.citizen_name || c.citizen_full_name || '').trim();
  const citizenName = (rawCitizen && rawCitizen !== 'Citizen One')
    ? rawCitizen
    : (c.citizen_email && c.citizen_email !== 'citizen@example.com' ? c.citizen_email : (rawCitizen || 'Citizen'));

  const mappedHistory = (c.status_history || []).map(h => {
    let actorName = h.updated_by_name || 'System';
    if (actorName === 'Authority One') {
      actorName = 'Municipal Authority';
    } else if (actorName === 'Citizen One' || h.updated_by_role === 'CITIZEN') {
      actorName = citizenName;
    }
    return {
      ...h,
      date: h.date || (h.updated_at ? h.updated_at.split('T')[0] : 'N/A'),
      updated_by_name: actorName,
      updated_by_role: h.updated_by_role || null,
      action_label: h.action_label || null
    };
  });
  return {
    ...c,
    citizen_name: citizenName,
    submittedDate: c.created_at ? c.created_at.split('T')[0] : 'N/A',
    lastUpdated: c.updated_at ? c.updated_at.split('T')[0] : 'N/A',
    photo: c.image,
    department: c.department_name || (typeof c.department === 'string' ? c.department : 'Unassigned'),
    assigned_staff_members: c.assigned_staff_members || [],
    assigned_staff_ids: c.assigned_staff_ids || [],
    is_assigned_to_current_user: Boolean(c.is_assigned_to_current_user),
    completion_photo: c.completion_photo || (c.latest_completion?.completion_photo) || (c.latest_completion?.completion_image) || null,
    latest_completion: c.latest_completion || null,
    completions: c.completions || [],
    verified_by_name: (c.verified_by_name === 'Authority One' ? 'Municipal Authority' : c.verified_by_name) || (c.latest_completion?.verified_by_name === 'Authority One' ? 'Municipal Authority' : c.latest_completion?.verified_by_name) || null,
    verified_at_formatted: c.verified_at_formatted || (c.latest_completion?.verified_at_formatted) || null,
    verification_remarks: c.verification_remarks || (c.latest_completion?.verification_remarks) || null,
    feedback: c.feedback || null,
    status_history: mappedHistory,
    history: mappedHistory,
    rejection_reason: c.rejection_reason || null,
    rejected_by_name: (c.rejected_by_name === 'Authority One' ? 'Municipal Authority' : c.rejected_by_name) || null,
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
      if (response.status === 401 || response.status === 403) {
        try {
          localStorage.removeItem('user');
        } catch (_e) {}
        throw new Error('Your session has expired or you are not logged in. Please log in again to submit your complaint.');
      }

      let errorMessage = `Failed to submit complaint (Error ${response.status})`;
      try {
        const text = await response.text();
        try {
          const errData = JSON.parse(text);
          if (typeof errData === 'object' && errData !== null) {
            if (errData.error) {
              errorMessage = errData.error;
            } else if (errData.detail) {
              errorMessage = errData.detail;
            } else {
              const firstKey = Object.keys(errData)[0];
              const val = errData[firstKey];
              if (Array.isArray(val)) {
                errorMessage = `${firstKey}: ${val.join(', ')}`;
              } else if (typeof val === 'object') {
                errorMessage = `${firstKey}: ${JSON.stringify(val)}`;
              } else {
                errorMessage = `${firstKey}: ${val}`;
              }
            }
          }
        } catch (_parseErr) {
          if (text && (text.includes('<!DOCTYPE') || text.includes('<html'))) {
            const match = text.match(/<pre class="exception_value">([^<]+)<\/pre>/i) ||
                          text.match(/<title>([^<]+)<\/title>/i) ||
                          text.match(/<th>Exception Value:<\/th>\s*<td><pre>([^<]+)<\/pre><\/td>/i);
            if (match && match[1]) {
              errorMessage = `Server Error (${response.status}): ${match[1].trim()}`;
            }
          } else if (text && text.trim().length > 0) {
            errorMessage = text.slice(0, 200);
          }
        }
      } catch (_streamErr) {
        console.error('Error reading response body:', _streamErr);
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
        const resolvedName = (data.full_name || data.fullName || data.name || data.first_name || data.username || localUser.full_name || '').trim();
        localStorage.setItem('user', JSON.stringify({ 
          ...localUser, 
          id: data.id || data.user_id, 
          user_id: data.user_id || data.id, 
          staff_id: data.staff_id, 
          email: data.email, 
          full_name: resolvedName, 
          role: data.role, 
          department: data.department 
        }));
        return {
          id: data.id || data.user_id,
          user_id: data.user_id || data.id,
          staff_id: data.staff_id,
          fullName: resolvedName,
          email: data.email,
          role: data.role,
          department: data.department
        };
      } else if (response.status === 401 || response.status === 403) {
        try {
          localStorage.removeItem('user');
        } catch (_e) {}
        return null;
      }
    } catch (e) {
      console.error(e);
    }
    // Fallback to local storage
    const user = JSON.parse(localStorage.getItem('user') || '{}');
    const fallbackName = (user.full_name || user.fullName || user.name || user.first_name || user.username || '').trim();
    return {
      id: user.id || user.user_id,
      user_id: user.user_id || user.id,
      staff_id: user.staff_id,
      fullName: fallbackName,
      email: user.email || '',
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

  // Staff mark work as completed (requires completion_remarks and completion photo)
  submitCompletion: async (id, data) => {
    let options = {};
    if (data instanceof FormData) {
      options = {
        method: 'POST',
        body: data,
      };
    } else {
      const formData = new FormData();
      if (data.completion_remarks) formData.append('completion_remarks', data.completion_remarks);
      if (data.completion_image) formData.append('completion_image', data.completion_image);
      options = {
        method: 'POST',
        body: formData,
      };
    }
    const response = await fetch(`${API_BASE_URL}/api/complaints/${id}/complete/`, options);
    if (!response.ok) {
      const err = await response.json().catch(() => ({}));
      throw new Error(err.error || err.detail || 'Failed to submit completion details');
    }
    const respData = await response.json();
    return respData.complaint ? mapComplaint(respData.complaint) : respData;
  },

  // Authority verify complaint (Approve or Reject)
  verifyComplaint: async (id, data) => {
    const response = await fetch(`${API_BASE_URL}/api/complaints/${id}/verify/`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(data),
    });
    if (!response.ok) {
      const err = await response.json().catch(() => ({}));
      throw new Error(err.error || err.detail || 'Failed to verify complaint');
    }
    const respData = await response.json();
    return respData.complaint ? mapComplaint(respData.complaint) : respData;
  },

  // Citizen submit or update optional feedback on resolved complaint
  submitFeedback: async (id, data) => {
    const response = await fetch(`${API_BASE_URL}/api/complaints/${id}/feedback/`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(data),
    });
    if (!response.ok) {
      const err = await response.json().catch(() => ({}));
      throw new Error(err.error || err.detail || 'Failed to submit feedback');
    }
    return await response.json();
  },

  // Citizen or Authority fetch feedback for complaint
  getFeedback: async (id) => {
    const response = await fetch(`${API_BASE_URL}/api/complaints/${id}/feedback/`);
    if (!response.ok) return null;
    return await response.json();
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

