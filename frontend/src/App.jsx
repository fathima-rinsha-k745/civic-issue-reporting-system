import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Layout from './components/layout/Layout';
import Home from './pages/Home';
import Login from './pages/Login';
import Register from './pages/Register';
import 'bootstrap/dist/css/bootstrap.min.css';
import './index.css';

import CitizenLayout from './components/layout/CitizenLayout';
import Dashboard from './pages/citizen/Dashboard';
import SubmitComplaint from './pages/citizen/SubmitComplaint';
import MyComplaints from './pages/citizen/MyComplaints';
import ComplaintDetails from './pages/citizen/ComplaintDetails';
import Profile from './pages/citizen/Profile';

import EditProfile from './pages/citizen/EditProfile';

import AuthorityLayout from './components/layout/AuthorityLayout';
import AuthorityDashboard from './pages/authority/Dashboard';
import AuthorityComplaintList from './pages/authority/ComplaintList';
import AuthorityComplaintDetails from './pages/authority/ComplaintDetails';
import AuthorityDepartments from './pages/authority/Departments';
import AuthorityStaff from './pages/authority/Staff';

import StaffLayout from './components/layout/StaffLayout';
import StaffDashboard from './pages/staff/Dashboard';
import StaffComplaintDetails from './pages/staff/ComplaintDetails';

function App() {
  return (
    <Router>
      <Routes>
        {/* Public Routes */}
        <Route path="/" element={<Layout />}>
          <Route index element={<Home />} />
          <Route path="citizen/login" element={<Login expectedRole="CITIZEN" title="Citizen Login" />} />
          <Route path="authority/login" element={<Login expectedRole="MUNICIPAL_AUTHORITY" title="Municipal Authority Login" />} />
          <Route path="staff/login" element={<Login expectedRole="DEPARTMENT_STAFF" title="Department Staff Login" />} />
          <Route path="register" element={<Register />} />
        </Route>

        {/* Citizen Protected Routes */}
        <Route path="/dashboard/citizen" element={<CitizenLayout />}>
          <Route index element={<Dashboard />} />
          <Route path="report" element={<SubmitComplaint />} />
          <Route path="complaints" element={<MyComplaints />} />
          <Route path="complaints/:id" element={<ComplaintDetails />} />
          <Route path="profile" element={<Profile />} />
          <Route path="profile/edit" element={<EditProfile />} />
        </Route>

        {/* Municipal Authority Protected Routes */}
        <Route path="/dashboard/municipal_authority" element={<AuthorityLayout />}>
          <Route index element={<AuthorityDashboard />} />
          <Route path="complaints" element={<AuthorityComplaintList />} />
          <Route path="complaints/:id" element={<AuthorityComplaintDetails />} />
          <Route path="departments" element={<AuthorityDepartments />} />
          <Route path="staff" element={<AuthorityStaff />} />
        </Route>
        
        {/* Department Staff Protected Routes */}
        <Route path="/dashboard/department_staff" element={<StaffLayout />}>
          <Route index element={<StaffDashboard />} />
          <Route path="complaints/:id" element={<StaffComplaintDetails />} />
        </Route>
        
      </Routes>
    </Router>
  );
}

export default App;
