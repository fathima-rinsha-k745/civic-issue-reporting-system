import React, { useState, useEffect, useMemo } from 'react';
import { Card, Row, Col, Spinner, Button, Alert } from 'react-bootstrap';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  LabelList
} from 'recharts';
import { api } from '../../services/api';
import { FaChartBar, FaCalendarAlt, FaMapMarkerAlt, FaExclamationTriangle, FaRedo } from 'react-icons/fa';

// Status colors aligned with dark navy theme
const STATUS_COLORS = {
  'Pending': '#F59E0B',        // Orange / Amber
  'In Progress': '#06B6D4',    // Cyan
  'Awaiting Conf.': '#8B5CF6', // Purple
  'Awaiting Verif.': '#8B5CF6',// Purple
  'Resolved': '#10B981',       // Green
  'Rejected': '#EF4444',       // Red
  'Unassigned': '#64748B'      // Slate Gray
};

// Predefined Category Colors matching reference image
const CATEGORY_COLORS = {
  'Roads & Potholes': '#FF7A00', // Orange (29% in reference)
  'Waste Management': '#10B981', // Green (24% in reference)
  'Water Supply': '#00B4D8',     // Cyan (18% in reference)
  'Drainage': '#A855F7',         // Purple (18% in reference)
  'Street Lighting': '#FACC15',   // Golden-Yellow (12% in reference)
  'Parks & Greenery': '#34D399', // Emerald
  'Other': '#64748B'             // Slate
};

// Tooltip for Bar & Line Charts
const CustomTooltip = ({ active, payload, label }) => {
  if (active && payload && payload.length) {
    return (
      <div
        className="px-2 py-1 rounded shadow-lg"
        style={{
          fontSize: '12px',
          minWidth: '120px',
          background: 'rgba(10, 24, 52, 0.95)',
          border: '1px solid rgba(59, 130, 246, 0.35)',
          color: '#ffffff'
        }}
      >
        <div className="fw-bold mb-1 border-bottom border-white border-opacity-10 pb-1 text-white">
          {(label === 'Awaiting Conf.' || label === 'Awaiting Verif.') ? 'Awaiting Authority Verification' : label}
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

// Tooltip for Doughnut Chart
const CategoryTooltip = ({ active, payload }) => {
  if (active && payload && payload.length) {
    const item = payload[0].payload;
    return (
      <div
        className="px-2 py-1 rounded shadow-lg"
        style={{
          fontSize: '12px',
          minWidth: '130px',
          background: 'rgba(10, 24, 52, 0.95)',
          border: `1px solid ${item.color || 'rgba(59, 130, 246, 0.35)'}`,
          color: '#ffffff'
        }}
      >
        <div className="fw-bold d-flex align-items-center gap-1 mb-1 text-white">
          <span
            className="rounded-circle flex-shrink-0"
            style={{ width: '8px', height: '8px', background: item.color }}
          />
          <span>{item.name}</span>
        </div>
        <div className="text-white-50 d-flex justify-content-between">
          <span>Complaints:</span>
          <span className="fw-bold text-white">{item.count} ({item.percentage}%)</span>
        </div>
      </div>
    );
  }
  return null;
};

const AnalyticsSection = ({ complaints: initialComplaints = null, unassignedCount = 0 }) => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [trendDays, setTrendDays] = useState(7);
  const [trendLoading, setTrendLoading] = useState(false);
  const [complaintsList, setComplaintsList] = useState(initialComplaints || []);

  const fetchAnalytics = async (days = 7, isFilterChange = false) => {
    try {
      if (isFilterChange) {
        setTrendLoading(true);
      } else {
        setLoading(true);
      }
      setError(null);

      const [res, fetchedComplaints] = await Promise.all([
        api.getAnalytics(days),
        (!initialComplaints || initialComplaints.length === 0)
          ? api.getMyComplaints().catch(() => [])
          : Promise.resolve(initialComplaints)
      ]);

      setData(res);
      setTrendDays(days);
      if (fetchedComplaints && fetchedComplaints.length > 0) {
        setComplaintsList(fetchedComplaints);
      }
    } catch (err) {
      console.error('Error fetching analytics:', err);
      setError(err.message || 'Failed to load analytics data.');
    } finally {
      setLoading(false);
      setTrendLoading(false);
    }
  };

  useEffect(() => {
    if (initialComplaints && initialComplaints.length > 0) {
      setComplaintsList(initialComplaints);
    }
  }, [initialComplaints]);

  useEffect(() => {
    fetchAnalytics(7);
  }, []);

  const handleFilterChange = (days) => {
    if (days === trendDays || trendLoading) return;
    fetchAnalytics(days, true);
  };

  // 1. Process Complaints by Status (matching reference bar chart with Pending, In Progress, Resolved, Rejected, Unassigned)
  const byStatusData = useMemo(() => {
    if (!data) return [];
    const statusMap = {};
    (data.by_status || []).forEach(item => {
      statusMap[item.status] = item.count;
    });

    const unassigned = unassignedCount ||
      complaintsList.filter(c => !c.department || c.department === 'Unassigned').length ||
      0;

    const list = [
      { status: 'Pending', count: statusMap['Pending'] || 0, color: STATUS_COLORS['Pending'] },
      { status: 'In Progress', count: statusMap['In Progress'] || 0, color: STATUS_COLORS['In Progress'] },
      { status: 'Resolved', count: statusMap['Resolved'] || 0, color: STATUS_COLORS['Resolved'] },
      { status: 'Rejected', count: statusMap['Rejected'] || 0, color: STATUS_COLORS['Rejected'] },
      { status: 'Unassigned', count: unassigned, color: STATUS_COLORS['Unassigned'] }
    ];

    const awaitingCount = (statusMap['Awaiting Authority Verification'] || 0) + (statusMap['Awaiting Citizen Confirmation'] || 0);
    if (awaitingCount > 0) {
      list.splice(2, 0, {
        status: 'Awaiting Verif.',
        count: awaitingCount,
        color: STATUS_COLORS['Awaiting Verif.']
      });
    }

    return list;
  }, [data, unassignedCount, complaintsList]);

  // 2. Process Daily Complaints Trend
  const dailyTrendData = useMemo(() => {
    return (data && data.daily_trend) || [];
  }, [data]);

  // 3. Process Issue Categories (Dynamically calculated from actual database complaints)
  const { categoriesData, totalComplaints } = useMemo(() => {
    const list = complaintsList || [];
    const total = list.length || (data && data.total_complaints) || 0;

    if (!list.length) {
      return { categoriesData: [], totalComplaints: total };
    }

    const counts = {
      'Roads & Potholes': 0,
      'Waste Management': 0,
      'Water Supply': 0,
      'Drainage': 0,
      'Street Lighting': 0
    };
    let otherCount = 0;

    list.forEach(c => {
      const cat = (c.category || '').toLowerCase();
      const dept = (c.department_name || (typeof c.department === 'string' ? c.department : '') || '').toLowerCase();
      const desc = (c.description || '').toLowerCase();
      const text = `${cat} ${dept} ${desc}`;

      if (text.includes('pothole') || text.includes('road') || text.includes('pavement') || text.includes('curb')) {
        counts['Roads & Potholes']++;
      } else if (text.includes('garbage') || text.includes('waste') || text.includes('sanitation') || text.includes('bin') || text.includes('dump')) {
        counts['Waste Management']++;
      } else if (text.includes('water') || text.includes('leak') || text.includes('pipeline') || text.includes('pipe')) {
        counts['Water Supply']++;
      } else if (text.includes('drain') || text.includes('sewage') || text.includes('sewer') || text.includes('manhole')) {
        counts['Drainage']++;
      } else if (text.includes('light') || text.includes('street') || text.includes('electr') || text.includes('lamp')) {
        counts['Street Lighting']++;
      } else {
        otherCount++;
      }
    });

    if (otherCount > 0) {
      counts['Other'] = otherCount;
    }

    const categories = Object.entries(counts)
      .filter(([_, count]) => count > 0)
      .map(([name, count]) => ({
        name,
        count,
        percentage: total > 0 ? Math.round((count / total) * 100) : 0,
        color: CATEGORY_COLORS[name] || '#60A5FA'
      }))
      .sort((a, b) => b.count - a.count);

    return { categoriesData: categories, totalComplaints: total };
  }, [complaintsList, data]);

  // Loading State
  if (loading) {
    return (
      <div className="mb-4">
        <Card className="civic-chart-card border-0 shadow-sm py-4 text-center">
          <Card.Body>
            <Spinner animation="border" variant="info" role="status" size="sm" className="mb-2" />
            <p className="text-secondary mb-0 small">Loading analytics charts...</p>
          </Card.Body>
        </Card>
      </div>
    );
  }

  // Error State
  if (error) {
    return (
      <div className="mb-4">
        <Alert variant="danger" className="border-0 shadow-sm d-flex align-items-center justify-content-between p-3" style={{ background: '#0E1B38', border: '1px solid rgba(239, 68, 68, 0.3)', color: '#F87171' }}>
          <div className="d-flex align-items-center">
            <FaExclamationTriangle className="me-2 fs-5" />
            <div>
              <strong>Analytics Error:</strong> {error}
            </div>
          </div>
          <Button variant="outline-danger" size="sm" onClick={() => fetchAnalytics(trendDays)}>
            <FaRedo className="me-1" /> Retry
          </Button>
        </Alert>
      </div>
    );
  }

  // Empty State
  if (!data || totalComplaints === 0) {
    return (
      <div className="mb-4">
        <Card className="civic-chart-card border-0 shadow-sm py-4 text-center">
          <Card.Body>
            <FaChartBar className="text-secondary mb-2" size={32} />
            <h6 className="text-white fw-bold mb-1">No Complaint Records Found</h6>
            <p className="text-secondary small mb-0">Analytics charts will display once complaints are submitted.</p>
          </Card.Body>
        </Card>
      </div>
    );
  }

  return (
    <div className="mb-4">
      {/* 3 Compact Charts in a Single Responsive Row */}
      <Row className="g-3">
        {/* ========================================================
            Chart 1: Complaints by Status (Bar Chart)
            ======================================================== */}
        <Col xl={4} lg={4} md={12} xs={12}>
          <Card className="civic-chart-card h-100 border-0 shadow-sm d-flex flex-column">
            <Card.Header className="d-flex align-items-center justify-content-between">
              <div>
                <h6 className="fw-bold mb-0 text-white d-flex align-items-center" style={{ fontSize: '0.92rem' }}>
                  <FaChartBar className="text-info me-2" size={14} />
                  Complaints by Status
                </h6>
                <div className="text-secondary" style={{ fontSize: '0.74rem' }}>
                  Distribution of all complaints across statuses
                </div>
              </div>
            </Card.Header>
            <Card.Body className="p-2 pt-1 flex-grow-1 d-flex flex-column justify-content-center">
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
                    <Tooltip content={<CustomTooltip />} />
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
            </Card.Body>
          </Card>
        </Col>

        {/* ========================================================
            Chart 2: Daily Complaints Trend (Line Chart)
            ======================================================== */}
        <Col xl={4} lg={4} md={12} xs={12}>
          <Card className="civic-chart-card h-100 border-0 shadow-sm d-flex flex-column">
            <Card.Header className="d-flex align-items-center justify-content-between flex-wrap gap-1">
              <div>
                <h6 className="fw-bold mb-0 text-white d-flex align-items-center" style={{ fontSize: '0.92rem' }}>
                  <FaCalendarAlt className="text-info me-2" size={13} />
                  Daily Complaints Trend
                </h6>
                <div className="text-secondary" style={{ fontSize: '0.74rem' }}>
                  Newly submitted complaints per day
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
                  onClick={() => handleFilterChange(7)}
                  disabled={trendLoading}
                >
                  Last 7 Days
                </Button>
                <Button
                  size="sm"
                  variant={trendDays === 30 ? 'primary' : 'link'}
                  className={`rounded px-2 py-0 fw-semibold text-nowrap text-decoration-none border-0 ${trendDays === 30 ? 'text-white' : 'text-secondary'}`}
                  style={{ fontSize: '10px', height: '22px', lineHeight: '20px' }}
                  onClick={() => handleFilterChange(30)}
                  disabled={trendLoading}
                >
                  Last 30 Days
                </Button>
              </div>
            </Card.Header>
            <Card.Body className="p-2 pt-1 flex-grow-1 d-flex flex-column justify-content-center position-relative">
              {trendLoading && (
                <div
                  className="position-absolute top-0 start-0 w-100 h-100 d-flex justify-content-center align-items-center rounded"
                  style={{ zIndex: 5, background: 'rgba(11, 25, 54, 0.8)' }}
                >
                  <Spinner animation="border" size="sm" variant="info" className="me-2" />
                  <span className="small text-white-50 fw-semibold" style={{ fontSize: '11px' }}>Updating...</span>
                </div>
              )}
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
                        value: 'Number of Complaints',
                        angle: -90,
                        position: 'insideLeft',
                        fill: '#94A3B8',
                        fontSize: 9.5,
                        offset: 14
                      }}
                    />
                    <Tooltip
                      content={({ active, payload }) => {
                        if (active && payload && payload.length) {
                          const item = payload[0].payload;
                          return (
                            <div
                              className="px-2 py-1 rounded shadow-lg"
                              style={{
                                fontSize: '12px',
                                background: 'rgba(10, 24, 52, 0.95)',
                                border: '1px solid rgba(59, 130, 246, 0.35)',
                                color: '#ffffff'
                              }}
                            >
                              <div className="fw-bold mb-1 text-white border-bottom border-white border-opacity-10 pb-1">
                                {item.date} ({item.formatted_date})
                              </div>
                              <div className="text-white-50 d-flex justify-content-between">
                                <span>New Complaints:</span>
                                <span className="fw-bold text-info ms-2">{item.count}</span>
                              </div>
                            </div>
                          );
                        }
                        return null;
                      }}
                    />
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
            </Card.Body>
          </Card>
        </Col>

        {/* ========================================================
            Chart 3: Issue Categories (Compact Doughnut Chart with Legend)
            ======================================================== */}
        <Col xl={4} lg={4} md={12} xs={12}>
          <Card className="civic-chart-card h-100 border-0 shadow-sm d-flex flex-column">
            <Card.Header className="d-flex align-items-center justify-content-between">
              <div>
                <h6 className="fw-bold mb-0 text-white d-flex align-items-center" style={{ fontSize: '0.92rem' }}>
                  <FaMapMarkerAlt className="text-info me-2" size={13} />
                  Issue Categories
                </h6>
                <div className="text-secondary" style={{ fontSize: '0.74rem' }}>
                  Complaints distribution by category
                </div>
              </div>
            </Card.Header>
            <Card.Body className="p-2 pt-1 flex-grow-1 d-flex align-items-center">
              {categoriesData.length === 0 ? (
                <div className="w-100 text-center py-4 text-secondary small">
                  No category data available
                </div>
              ) : (
                <div className="d-flex align-items-center justify-content-between w-100">
                  {/* Left: Compact Doughnut Chart with Center Count */}
                  <div className="position-relative" style={{ width: '52%', height: 195 }}>
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={categoriesData}
                          dataKey="count"
                          nameKey="name"
                          cx="50%"
                          cy="50%"
                          innerRadius={38}
                          outerRadius={65}
                          paddingAngle={2}
                          label={({ cx, cy, midAngle, innerRadius, outerRadius, percent }) => {
                            if (percent < 0.08) return null;
                            const RADIAN = Math.PI / 180;
                            const radius = innerRadius + (outerRadius - innerRadius) * 0.52;
                            const x = cx + radius * Math.cos(-midAngle * RADIAN);
                            const y = cy + radius * Math.sin(-midAngle * RADIAN);
                            return (
                              <text
                                x={x}
                                y={y}
                                fill="#ffffff"
                                textAnchor="middle"
                                dominantBaseline="central"
                                fontSize={9.5}
                                fontWeight={700}
                              >
                                {`${Math.round(percent * 100)}%`}
                              </text>
                            );
                          }}
                          labelLine={false}
                        >
                          {categoriesData.map((entry, index) => (
                            <Cell
                              key={`category-cell-${index}`}
                              fill={entry.color}
                              stroke="#0B1936"
                              strokeWidth={1.5}
                            />
                          ))}
                        </Pie>
                        <Tooltip content={<CategoryTooltip />} />
                      </PieChart>
                    </ResponsiveContainer>

                    {/* Center Total Count Overlay */}
                    <div
                      className="position-absolute top-50 start-50 translate-middle text-center"
                      style={{ pointerEvents: 'none', lineHeight: 1 }}
                    >
                      <div className="text-white fw-bold" style={{ fontSize: '1.35rem' }}>
                        {totalComplaints}
                      </div>
                      <div className="text-secondary" style={{ fontSize: '0.7rem', marginTop: '2px' }}>
                        Total
                      </div>
                    </div>
                  </div>

                  {/* Right: Matching Color Legend List with Percentages */}
                  <div
                    className="d-flex flex-column justify-content-center"
                    style={{ width: '48%', gap: '6px', paddingLeft: '4px' }}
                  >
                    {categoriesData.map((item, idx) => (
                      <div
                        key={`cat-legend-${idx}`}
                        className="d-flex align-items-center justify-content-between"
                        style={{ fontSize: '11px', lineHeight: 1.25 }}
                      >
                        <div className="d-flex align-items-center gap-2 text-truncate pe-1">
                          <span
                            className="rounded-circle flex-shrink-0"
                            style={{ width: '8px', height: '8px', background: item.color }}
                          />
                          <span
                            className="text-truncate text-white-50"
                            title={item.name}
                            style={{ maxWidth: '95px' }}
                          >
                            {item.name}
                          </span>
                        </div>
                        <span className="fw-bold text-white flex-shrink-0">
                          {item.percentage}%
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </Card.Body>
          </Card>
        </Col>
      </Row>
    </div>
  );
};

export default AnalyticsSection;
