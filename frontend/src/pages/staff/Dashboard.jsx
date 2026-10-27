import React, { useState, useEffect, useMemo } from 'react';
import { Card, Button, Table, Badge, Spinner, Row, Col } from 'react-bootstrap';
import { Link } from 'react-router-dom';
import { FaEye, FaEnvelope, FaChartBar, FaCalendarAlt } from 'react-icons/fa';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  LineChart,
  Line,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  LabelList
} from 'recharts';
import { api } from '../../services/api';

// Status colors aligned with dark navy theme and Municipal Authority dashboard
const STATUS_COLORS = {
  'Pending': '#F59E0B',        // Orange / Amber
  'In Progress': '#06B6D4',    // Cyan
  'Awaiting Conf.': '#8B5CF6', // Purple
  'Resolved': '#10B981',       // Green
  'Rejected': '#EF4444'        // Red
};

// Tooltip for Bar Chart (Complaints by Status)
const StatusTooltip = ({ active, payload, label }) => {
  if (active && payload && payload.length) {
    const fullLabel = (label === 'Awaiting Conf.' || label === 'Awaiting Verif.') ? 'Awaiting Authority Verification' : label;
    return (
      <div
        className="px-2 py-1 rounded shadow-lg"
        style={{
          fontSize: '12px',
          minWidth: '130px',
          background: 'rgba(10, 24, 52, 0.95)',
          border: '1px solid rgba(59, 130, 246, 0.35)',
          color: '#ffffff'
        }}
      >
        <div className="fw-bold mb-1 border-bottom border-white border-opacity-10 pb-1 text-white">
          {fullLabel}
        </div>
        <div className="text-white-50 d-flex justify-content-between align-items-center">
          <span>Complaints:</span>
          <span className="fw-bold text-info ms-2">{payload[0].value}</span>
        </div>
      </div>
    );
  }
  return null;
};

// Tooltip for Line Chart (Daily Complaints Trend)
const TrendTooltip = ({ active, payload }) => {
  if (active && payload && payload.length) {
    const item = payload[0].payload;
    return (
      <div
        className="px-2 py-1 rounded shadow-lg"
        style={{
          fontSize: '12px',
          minWidth: '130px',
          background: 'rgba(10, 24, 52, 0.95)',
          border: '1px solid rgba(59, 130, 246, 0.35)',
          color: '#ffffff'
        }}
      >
        <div className="fw-bold mb-1 text-white border-bottom border-white border-opacity-10 pb-1">
          {item.date} ({item.formatted_date})
        </div>
        <div className="text-white-50 d-flex justify-content-between align-items-center">
          <span>Assigned:</span>
          <span className="fw-bold text-info ms-2">{item.count}</span>
        </div>
      </div>
    );
  }
  return null;
};

const StaffDashboard = () => {
  const [complaints, setComplaints] = useState([]);
  const [loading, setLoading] = useState(true);
  const [trendDays, setTrendDays] = useState(7);
  const [userProfile, setUserProfile] = useState(() => {
    try {
      const stored = localStorage.getItem('user');
      if (stored) {
        const u = JSON.parse(stored);
        return {
          fullName: u.full_name || 'Staff Member',
          email: u.email || '',
          department: u.department || '',
          role: u.role || 'DEPARTMENT_STAFF'
        };
      }
    } catch (e) {}
    return { fullName: 'Staff Member', email: '', department: '', role: 'DEPARTMENT_STAFF' };
  });

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        setLoading(true);
        const [profileData, complaintsData] = await Promise.all([
          api.getProfile().catch(() => null),
          api.getMyComplaints()
        ]);
        if (profileData && (profileData.fullName || profileData.email)) {
          setUserProfile(profileData);
        }
        setComplaints(complaintsData || []);
      } catch (error) {
        console.error("Failed to load dashboard data", error);
      } finally {
        setLoading(false);
      }
    };
    
    fetchDashboardData();
  }, []);

  const getStatusBadge = (status) => {
    switch(status) {
      case 'Pending': return <Badge bg="warning" text="dark">Pending</Badge>;
      case 'In Progress': return <Badge bg="info">In Progress</Badge>;
      case 'Awaiting Authority Verification':
      case 'Awaiting Citizen Confirmation': return <Badge bg="primary">Awaiting Authority Verification</Badge>;
      case 'Resolved': return <Badge bg="success">Resolved</Badge>;
      case 'Rejected': return <Badge bg="danger">Rejected</Badge>;
      default: return <Badge bg="secondary">{status}</Badge>;
    }
  };

  // Filter complaints strictly assigned to the logged-in staff member
  const myAssignedComplaints = useMemo(() => {
    const userEmail = (userProfile?.email || '').toLowerCase().trim();
    const userName = (userProfile?.fullName || '').toLowerCase().trim();

    return (complaints || []).filter(c => {
      const assignments = c.assigned_staff_members;
      if (!Array.isArray(assignments) || assignments.length === 0) {
        return false;
      }

      if (userEmail) {
        return assignments.some(a => {
          if (a.is_active === false) return false;
          const aEmail = (a.staff_email || a.email || '').toLowerCase().trim();
          return aEmail === userEmail;
        });
      }

      if (userName && userName !== 'staff member') {
        return assignments.some(a => {
          if (a.is_active === false) return false;
          const aName = (a.staff_name || a.name || '').toLowerCase().trim();
          return aName === userName;
        });
      }

      return assignments.some(a => a.is_active !== false);
    });
  }, [complaints, userProfile]);

  // 1. Process Complaints by Status (Bar Chart)
  const byStatusData = useMemo(() => {
    const statusMap = {
      'Pending': 0,
      'In Progress': 0,
      'Awaiting Authority Verification': 0,
      'Resolved': 0,
      'Rejected': 0
    };

    myAssignedComplaints.forEach(c => {
      const st = c.status;
      if (statusMap[st] !== undefined) {
        statusMap[st]++;
      } else if (st === 'Awaiting Conf.' || st === 'Awaiting Citizen Confirmation') {
        statusMap['Awaiting Authority Verification']++;
      }
    });

    return [
      { status: 'Pending', count: statusMap['Pending'], color: STATUS_COLORS['Pending'] },
      { status: 'In Progress', count: statusMap['In Progress'], color: STATUS_COLORS['In Progress'] },
      { status: 'Awaiting Conf.', count: statusMap['Awaiting Authority Verification'], color: STATUS_COLORS['Awaiting Conf.'] },
      { status: 'Resolved', count: statusMap['Resolved'], color: STATUS_COLORS['Resolved'] },
      { status: 'Rejected', count: statusMap['Rejected'], color: STATUS_COLORS['Rejected'] }
    ];
  }, [myAssignedComplaints]);

  // 2. Process Daily Complaints Trend (Line Chart)
  const dailyTrendData = useMemo(() => {
    const days = trendDays; // 7 or 30
    const today = new Date();
    const result = [];
    const dateCounts = {};

    // Generate date sequence for the selected window (Last 7 or 30 days)
    for (let i = days - 1; i >= 0; i--) {
      const d = new Date(today);
      d.setDate(today.getDate() - i);
      const year = d.getFullYear();
      const month = String(d.getMonth() + 1).padStart(2, '0');
      const day = String(d.getDate()).padStart(2, '0');
      const isoDate = `${year}-${month}-${day}`;
      const monthName = d.toLocaleDateString('en-US', { month: 'short' });
      const formatted_date = `${monthName} ${d.getDate()}`;

      result.push({
        date: isoDate,
        formatted_date,
        count: 0
      });
      dateCounts[isoDate] = 0;
    }

    // Tally complaints assigned to this staff member on each date
    const userEmail = (userProfile?.email || '').toLowerCase().trim();
    myAssignedComplaints.forEach(c => {
      let assignmentDate = null;
      if (Array.isArray(c.assigned_staff_members) && c.assigned_staff_members.length > 0) {
        const myAssignment = c.assigned_staff_members.find(a => {
          const aEmail = (a.staff_email || a.email || '').toLowerCase().trim();
          return userEmail ? aEmail === userEmail : true;
        });
        if (myAssignment && myAssignment.assigned_at) {
          assignmentDate = myAssignment.assigned_at.split(' ')[0].split('T')[0];
        }
      }
      if (!assignmentDate && c.created_at) {
        assignmentDate = c.created_at.split('T')[0];
      }
      if (!assignmentDate && c.submittedDate && c.submittedDate !== 'N/A') {
        assignmentDate = c.submittedDate;
      }

      if (assignmentDate && dateCounts[assignmentDate] !== undefined) {
        dateCounts[assignmentDate]++;
      }
    });

    return result.map(item => ({
      ...item,
      count: dateCounts[item.date] || 0
    }));
  }, [myAssignedComplaints, trendDays, userProfile?.email]);

  // Summary counts based on complaints assigned to this staff member
  const total = myAssignedComplaints.length;
  const pending = myAssignedComplaints.filter(c => c.status === 'Pending').length;
  const inProgress = myAssignedComplaints.filter(c => c.status === 'In Progress').length;
  const awaitingConfirmation = myAssignedComplaints.filter(c => c.status === 'Awaiting Authority Verification' || c.status === 'Awaiting Citizen Confirmation').length;
  const resolved = myAssignedComplaints.filter(c => c.status === 'Resolved').length;

  // Recent assigned complaints list
  const recentComplaints = (myAssignedComplaints.length > 0 ? myAssignedComplaints : complaints).slice(0, 5);

  return (
    <div>
      {/* Page Header */}
      <div className="d-flex flex-column flex-md-row justify-content-between align-items-start align-items-md-center gap-3 mb-4">
        <div>
          <h2 className="mb-1 text-white fw-bold fs-3 fs-sm-2">
            Welcome Back, {userProfile.fullName || 'Staff Member'}
          </h2>
          <p className="text-secondary mb-0">View assigned complaints and update their progress.</p>
        </div>
        <div className="d-flex align-items-center gap-2">
          <Badge bg="primary" className="px-3 py-2 fw-medium text-uppercase">
            {userProfile.department || 'Assigned Department'}
          </Badge>
          <Button 
            as={Link} 
            to="/dashboard/department_staff/profile" 
            variant="outline-primary" 
            size="sm"
            className="fw-medium"
          >
            View Profile
          </Button>
        </div>
      </div>

      {/* Summary Cards - Compact & Neatly Aligned in a Single Row */}
      <Row className="g-2 g-md-3 mb-4">
        <Col xs={6} md>
          <div className="civic-stat-card py-3 px-2">
            <div className="civic-stat-value text-white">{total}</div>
            <div className="civic-stat-label">Total Assigned</div>
          </div>
        </Col>
        <Col xs={6} md>
          <div className="civic-stat-card py-3 px-2" style={{ borderBottom: '2px solid #F59E0B' }}>
            <div className="civic-stat-value text-warning">{pending}</div>
            <div className="civic-stat-label">Pending</div>
          </div>
        </Col>
        <Col xs={6} md>
          <div className="civic-stat-card py-3 px-2" style={{ borderBottom: '2px solid #06B6D4' }}>
            <div className="civic-stat-value text-info">{inProgress}</div>
            <div className="civic-stat-label">In Progress</div>
          </div>
        </Col>
        <Col xs={6} md>
          <div className="civic-stat-card py-3 px-2" style={{ borderBottom: '2px solid #8B5CF6' }}>
            <div className="civic-stat-value text-primary">{awaitingConfirmation}</div>
            <div className="civic-stat-label">Awaiting Verification</div>
          </div>
        </Col>
        <Col xs={12} md>
          <div className="civic-stat-card py-3 px-2" style={{ borderBottom: '2px solid #10B981' }}>
            <div className="civic-stat-value text-success">{resolved}</div>
            <div className="civic-stat-label">Resolved</div>
          </div>
        </Col>
      </Row>

      {/* Charts Section: 2 Compact Graphs Side-by-Side on Desktop */}
      <Row className="g-3 mb-4">
        {/* ========================================================
            Chart 1: Complaints by Status (Bar Chart)
            ======================================================== */}
        <Col lg={6} xs={12}>
          <Card className="civic-chart-card h-100 border-0 shadow-sm d-flex flex-column">
            <Card.Header className="d-flex align-items-center justify-content-between">
              <div>
                <h6 className="fw-bold mb-0 text-white d-flex align-items-center" style={{ fontSize: '0.92rem' }}>
                  <FaChartBar className="text-info me-2" size={14} />
                  Complaints by Status
                </h6>
                <div className="text-secondary" style={{ fontSize: '0.74rem' }}>
                  Status distribution of complaints assigned to you
                </div>
              </div>
              <Badge bg="secondary" className="px-2 py-1 fw-medium" style={{ fontSize: '10.5px' }}>
                {total} Assigned
              </Badge>
            </Card.Header>
            <Card.Body className="p-2 pt-1 flex-grow-1 d-flex flex-column justify-content-center">
              {loading ? (
                <div className="d-flex justify-content-center align-items-center" style={{ height: 195 }}>
                  <Spinner animation="border" variant="info" size="sm" className="me-2" />
                  <span className="text-secondary small">Loading chart data...</span>
                </div>
              ) : (
                <div style={{ width: '100%', height: 195 }}>
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart
                      data={byStatusData}
                      margin={{ top: 16, right: 8, left: -24, bottom: 4 }}
                    >
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(255, 255, 255, 0.07)" />
                      <XAxis
                        dataKey="status"
                        stroke="rgba(255, 255, 255, 0.25)"
                        interval={0}
                        tick={{ fontSize: 9.5, fill: '#CBD5E1', fontWeight: 500 }}
                      />
                      <YAxis
                        allowDecimals={false}
                        stroke="rgba(255, 255, 255, 0.25)"
                        tick={{ fontSize: 9.5, fill: '#94A3B8' }}
                        label={{
                          value: 'Number of Complaints',
                          angle: -90,
                          position: 'insideLeft',
                          fill: '#94A3B8',
                          fontSize: 9.5,
                          offset: 14
                        }}
                      />
                      <Tooltip content={<StatusTooltip />} />
                      <Bar dataKey="count" radius={[3, 3, 0, 0]} maxBarSize={28}>
                        <LabelList
                          dataKey="count"
                          position="top"
                          style={{ fill: '#F8FAFC', fontWeight: 600, fontSize: 10 }}
                        />
                        {byStatusData.map((entry, index) => (
                          <Cell
                            key={`status-cell-${index}`}
                            fill={entry.color || '#2563EB'}
                          />
                        ))}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              )}
            </Card.Body>
          </Card>
        </Col>

        {/* ========================================================
            Chart 2: Daily Complaints Trend (Line Chart)
            ======================================================== */}
        <Col lg={6} xs={12}>
          <Card className="civic-chart-card h-100 border-0 shadow-sm d-flex flex-column">
            <Card.Header className="d-flex align-items-center justify-content-between flex-wrap gap-1">
              <div>
                <h6 className="fw-bold mb-0 text-white d-flex align-items-center" style={{ fontSize: '0.92rem' }}>
                  <FaCalendarAlt className="text-info me-2" size={13} />
                  Daily Complaints Trend
                </h6>
                <div className="text-secondary" style={{ fontSize: '0.74rem' }}>
                  Assigned complaints trend ({trendDays === 7 ? 'Last 7 Days' : 'Last 30 Days'})
                </div>
              </div>
              <div
                className="d-flex align-items-center p-1 rounded"
                style={{ background: '#09142A', border: '1px solid rgba(59, 130, 246, 0.2)' }}
              >
                <Button
                  size="sm"
                  variant={trendDays === 7 ? 'primary' : 'link'}
                  className={`rounded px-2 py-0 fw-semibold text-nowrap text-decoration-none border-0 ${trendDays === 7 ? 'text-white' : 'text-secondary'}`}
                  style={{ fontSize: '10px', height: '22px', lineHeight: '20px' }}
                  onClick={() => setTrendDays(7)}
                >
                  Last 7 Days
                </Button>
                <Button
                  size="sm"
                  variant={trendDays === 30 ? 'primary' : 'link'}
                  className={`rounded px-2 py-0 fw-semibold text-nowrap text-decoration-none border-0 ${trendDays === 30 ? 'text-white' : 'text-secondary'}`}
                  style={{ fontSize: '10px', height: '22px', lineHeight: '20px' }}
                  onClick={() => setTrendDays(30)}
                >
                  Last 30 Days
                </Button>
              </div>
            </Card.Header>
            <Card.Body className="p-2 pt-1 flex-grow-1 d-flex flex-column justify-content-center position-relative">
              {loading ? (
                <div className="d-flex justify-content-center align-items-center" style={{ height: 195 }}>
                  <Spinner animation="border" variant="info" size="sm" className="me-2" />
                  <span className="text-secondary small">Loading trend data...</span>
                </div>
              ) : (
                <div style={{ width: '100%', height: 195 }}>
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart
                      data={dailyTrendData}
                      margin={{ top: 16, right: 10, left: -24, bottom: trendDays === 30 ? 25 : 4 }}
                    >
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(255, 255, 255, 0.07)" />
                      <XAxis
                        dataKey="formatted_date"
                        stroke="rgba(255, 255, 255, 0.25)"
                        interval={trendDays === 30 ? 3 : 0}
                        tick={{ fontSize: 9.5, fill: '#CBD5E1', fontWeight: 500 }}
                      />
                      <YAxis
                        allowDecimals={false}
                        stroke="rgba(255, 255, 255, 0.25)"
                        tick={{ fontSize: 9.5, fill: '#94A3B8' }}
                        label={{
                          value: 'Assigned Complaints',
                          angle: -90,
                          position: 'insideLeft',
                          fill: '#94A3B8',
                          fontSize: 9.5,
                          offset: 14
                        }}
                      />
                      <Tooltip content={<TrendTooltip />} />
                      <Line
                        type="monotone"
                        dataKey="count"
                        stroke="#2563EB"
                        strokeWidth={2.2}
                        dot={{ r: 3.5, fill: '#06B6D4', stroke: '#2563EB', strokeWidth: 1.5 }}
                        activeDot={{ r: 5, fill: '#38BDF8', stroke: '#ffffff', strokeWidth: 2 }}
                      >
                        <LabelList
                          dataKey="count"
                          position="top"
                          formatter={(val) => (val > 0 ? val : (trendDays === 7 ? '0' : ''))}
                          style={{ fill: '#F8FAFC', fontWeight: 600, fontSize: 10 }}
                        />
                      </Line>
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              )}
            </Card.Body>
          </Card>
        </Col>
      </Row>

      <div className="d-flex flex-column flex-sm-row justify-content-between align-items-start align-items-sm-center gap-2 mb-4">
        <h3 className="mb-0 text-white fw-bold fs-4 fs-sm-3">Recent Assigned Complaints</h3>
        <Button 
          as={Link} 
          to="/dashboard/department_staff/complaints" 
          variant="outline-primary"
          size="sm"
          className="w-100 w-sm-auto"
        >
          View All Complaints
        </Button>
      </div>

      <Card className="border-0 shadow-sm mb-4">
        <Card.Body className="p-3 p-sm-4">
          {loading ? (
            <div className="text-center py-5">
              <Spinner animation="border" variant="primary" />
            </div>
          ) : recentComplaints.length === 0 ? (
            <div className="text-center py-5 text-muted bg-light rounded">
              <p className="mb-0">No assigned complaints found.</p>
            </div>
          ) : (
            <>
              <div className="d-none d-md-block">
              {/* Desktop Table View */}
              <div className="table-responsive">
                <Table hover className="align-middle border mb-0">
                  <thead className="table-light">
                    <tr>
                      <th style={{ width: '85px', minWidth: '75px' }}>ID</th>
                      <th style={{ minWidth: '150px' }}>Description</th>
                      <th style={{ minWidth: '130px' }}>Location</th>
                      <th style={{ minWidth: '100px' }}>Status</th>
                      <th style={{ minWidth: '140px' }}>Assigned Team</th>
                      <th style={{ minWidth: '130px' }}>Completion Remarks</th>
                      <th style={{ minWidth: '140px', textAlign: 'center' }}>Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {recentComplaints.map((c) => (
                      <tr key={c.id}>
                        <td className="fw-medium">
                          <Link 
                            to={`/dashboard/department_staff/complaints/${c.id}`}
                            className="text-info text-decoration-none fw-bold"
                          >
                            #{c.id}
                          </Link>
                        </td>
                        <td>
                          <div className="text-truncate" style={{ maxWidth: '170px' }} title={c.description}>
                            {c.description}
                          </div>
                        </td>
                        <td>
                          <div className="text-truncate" style={{ maxWidth: '130px' }} title={c.location}>
                            {c.location}
                          </div>
                        </td>
                        <td>{getStatusBadge(c.status)}</td>
                        <td>
                          {c.assigned_staff_members && c.assigned_staff_members.length > 0 ? (
                            <div className="d-flex flex-wrap gap-1" style={{ maxWidth: '160px' }}>
                              {c.assigned_staff_members.map((a, i) => {
                                const sEmail = a.staff_email || a.email;
                                const sName = a.staff_name || a.name || sEmail;
                                const isYou = sEmail && sEmail === userProfile.email;
                                return (
                                  <Badge 
                                    key={i} 
                                    bg={isYou ? "primary" : "secondary"}
                                    className="fw-normal"
                                  >
                                    {sName} {isYou && '(You)'}
                                  </Badge>
                                );
                              })}
                            </div>
                          ) : (
                            <span className="text-muted small">None</span>
                          )}
                        </td>
                        <td>
                          {c.latest_completion?.completion_remarks ? (
                            <div className="text-truncate text-secondary small" style={{ maxWidth: '140px' }} title={c.latest_completion.completion_remarks}>
                              {c.latest_completion.completion_remarks}
                            </div>
                          ) : (
                            <span className="text-muted small">—</span>
                          )}
                        </td>
                        <td className="text-center">
                          <Button 
                            as={Link} 
                            to={`/dashboard/department_staff/complaints/${c.id}`}
                            variant="outline-info" 
                            size="sm"
                            className="d-inline-flex align-items-center text-nowrap px-3 py-1 shadow-sm"
                          >
                            <FaEye className="me-1" /> View / Update
                          </Button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </Table>
              </div>
            </div>

            {/* Mobile Card View */}
            <div className="d-block d-md-none">
                {recentComplaints.map((c) => (
                  <Card key={c.id} className="mb-3 shadow-sm border">
                    <Card.Body className="p-3">
                      <div className="d-flex justify-content-between align-items-start mb-2 gap-2">
                        <span className="fw-bold text-dark fs-6">#{c.id}</span>
                        {getStatusBadge(c.status)}
                      </div>
                      <p className="mb-1 text-truncate text-dark small">{c.description}</p>
                      <p className="mb-2 text-muted small"><i className="bi bi-geo-alt me-1"></i>{c.location}</p>
                      
                      {c.assigned_staff_members && c.assigned_staff_members.length > 0 && (
                        <div className="mb-2">
                          <small className="text-muted d-block mb-1">Assigned Team:</small>
                          <div className="d-flex flex-wrap gap-1">
                            {c.assigned_staff_members.map((a, i) => {
                              const sEmail = a.staff_email || a.email;
                              const sName = a.staff_name || a.name || sEmail;
                              const isYou = sEmail && sEmail === userProfile.email;
                              return (
                                <Badge 
                                  key={i} 
                                  bg={isYou ? "primary" : "secondary"}
                                  className="fw-normal"
                                >
                                  {sName} {isYou && '(You)'}
                                </Badge>
                              );
                            })}
                          </div>
                        </div>
                      )}

                      {c.latest_completion?.completion_remarks && (
                        <div className="mb-2 p-2 bg-light rounded small text-secondary">
                          <strong>Remarks:</strong> {c.latest_completion.completion_remarks}
                        </div>
                      )}

                      <div className="d-flex justify-content-between align-items-center mt-3 pt-2 border-top">
                        <small className="text-muted">{c.submittedDate}</small>
                        <Button 
                          as={Link} 
                          to={`/dashboard/department_staff/complaints/${c.id}`}
                          variant="outline-primary" 
                          size="sm"
                          className="px-3"
                        >
                          Update
                        </Button>
                      </div>
                    </Card.Body>
                  </Card>
                ))}
              </div>
            </>
          )}

        </Card.Body>
      </Card>
    </div>
  );
};

export default StaffDashboard;
