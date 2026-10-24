import React, { useState, useEffect } from 'react';
import { Card, Row, Col, Spinner, Button, Alert } from 'react-bootstrap';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Cell,
  LabelList
} from 'recharts';
import { api } from '../../services/api';
import { FaChartBar, FaCalendarAlt, FaExclamationTriangle, FaRedo } from 'react-icons/fa';

// Status colors aligned with homepage dark navy theme: cyan, green, orange, red
const STATUS_COLORS = {
  'Pending': '#F59E0B',                      // Orange / Amber
  'In Progress': '#06B6D4',                  // Cyan
  'Awaiting Citizen Confirmation': '#8B5CF6', // Purple
  'Resolved': '#10B981',                     // Green
  'Rejected': '#EF4444',                     // Red
};

// Custom Tooltip component
const CustomTooltip = ({ active, payload, label }) => {
  if (active && payload && payload.length) {
    return (
      <div
        className="px-3 py-2 rounded shadow-lg"
        style={{
          fontSize: '13px',
          minWidth: '130px',
          background: 'rgba(10, 24, 52, 0.95)',
          border: '1px solid rgba(59, 130, 246, 0.35)',
          color: '#ffffff'
        }}
      >
        <p className="fw-bold mb-1 border-bottom border-white border-opacity-10 pb-1 text-white">{label}</p>
        <p className="mb-0 text-white-50 d-flex justify-content-between align-items-center">
          <span>Count:</span>
          <span className="fw-bold text-info ms-2 fs-6">{payload[0].value}</span>
        </p>
      </div>
    );
  }
  return null;
};

const AnalyticsSection = () => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [trendDays, setTrendDays] = useState(7);
  const [trendLoading, setTrendLoading] = useState(false);

  const fetchAnalytics = async (days = 7, isFilterChange = false) => {
    try {
      if (isFilterChange) {
        setTrendLoading(true);
      } else {
        setLoading(true);
      }
      setError(null);

      const res = await api.getAnalytics(days);
      setData(res);
      setTrendDays(days);
    } catch (err) {
      console.error('Error fetching analytics:', err);
      setError(err.message || 'Failed to load analytics data.');
    } finally {
      setLoading(false);
      setTrendLoading(false);
    }
  };

  useEffect(() => {
    fetchAnalytics(7);
  }, []);

  const handleFilterChange = (days) => {
    if (days === trendDays || trendLoading) return;
    fetchAnalytics(days, true);
  };

  // Loading State
  if (loading) {
    return (
      <div className="mb-4">
        <Card className="border-0 shadow-sm py-5 text-center">
          <Card.Body>
            <Spinner animation="border" variant="primary" role="status" className="mb-3" />
            <p className="text-muted mb-0 fw-semibold">Loading dashboard analytics...</p>
          </Card.Body>
        </Card>
      </div>
    );
  }

  // Error State
  if (error) {
    return (
      <div className="mb-4">
        <Alert variant="danger" className="border-0 shadow-sm d-flex align-items-center justify-content-between p-3">
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
  if (!data || data.total_complaints === 0) {
    return (
      <div className="mb-4">
        <Card className="border-0 shadow-sm py-4 text-center">
          <Card.Body>
            <FaChartBar className="text-muted mb-2" size={36} />
            <h5 className="text-dark fw-bold">No Complaint Records Found</h5>
            <p className="text-muted mb-0">Analytics charts will display once complaints are submitted.</p>
          </Card.Body>
        </Card>
      </div>
    );
  }

  const byStatusData = data.by_status || [];
  const dailyTrendData = data.daily_trend || [];

  return (
    <div className="mb-4">
      {/* Row: Complaints by Status & Daily Complaints Trend */}
      <Row className="g-3 mb-4">
        {/* Graph 1: Complaints by Status – Clean Bar Chart */}
        <Col lg={6} xs={12}>
          <Card className="border-0 shadow-sm h-100">
            <Card.Header className="border-bottom-0 pt-3 pb-0 px-3 px-sm-4 d-flex justify-content-between align-items-center">
              <div>
                <h5 className="fw-bold mb-1 d-flex align-items-center text-white" style={{ fontSize: '1rem' }}>
                  <FaChartBar className="text-primary me-2" size={16} />
                  Complaints by Status
                </h5>
                <span className="text-secondary small">Distribution of all complaints across statuses</span>
              </div>
            </Card.Header>
            <Card.Body className="p-3 pt-2">
              <div style={{ width: '100%', height: 300 }}>
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart
                    data={byStatusData}
                    margin={{ top: 20, right: 15, left: -15, bottom: 40 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(255, 255, 255, 0.06)" />
                    <XAxis
                      dataKey="status"
                      stroke="rgba(255, 255, 255, 0.3)"
                      interval={0}
                      tick={({ x, y, payload }) => {
                        const label = payload.value === 'Awaiting Citizen Confirmation'
                          ? 'Awaiting Conf.'
                          : payload.value;
                        return (
                          <g transform={`translate(${x},${y})`}>
                            <text
                              x={0}
                              y={0}
                              dy={14}
                              textAnchor="end"
                              fill="rgba(255, 255, 255, 0.75)"
                              fontSize={11}
                              fontWeight={500}
                              transform="rotate(-25)"
                            >
                              {label}
                            </text>
                          </g>
                        );
                      }}
                    />
                    <YAxis
                      allowDecimals={false}
                      stroke="rgba(255, 255, 255, 0.3)"
                      tick={{ fontSize: 11, fill: 'rgba(255, 255, 255, 0.75)' }}
                    />
                    <Tooltip content={<CustomTooltip />} />
                    <Bar dataKey="count" radius={[4, 4, 0, 0]} maxBarSize={48}>
                      <LabelList
                        dataKey="count"
                        position="top"
                        style={{ fill: '#F8FAFC', fontWeight: 600, fontSize: 11 }}
                      />
                      {byStatusData.map((entry, index) => (
                        <Cell
                          key={`status-cell-${index}`}
                          fill={STATUS_COLORS[entry.status] || '#2563EB'}
                        />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </Card.Body>
          </Card>
        </Col>

        {/* Graph 2: Daily Complaints Trend – Professional Line Chart */}
        <Col lg={6} xs={12}>
          <Card className="border-0 shadow-sm h-100">
            <Card.Header className="border-bottom-0 pt-3 pb-0 px-3 px-sm-4 d-flex flex-wrap justify-content-between align-items-center gap-2">
              <div>
                <h5 className="fw-bold mb-1 d-flex align-items-center text-white" style={{ fontSize: '1rem' }}>
                  <FaCalendarAlt className="text-primary me-2" size={15} />
                  Daily Complaints Trend
                </h5>
                <span className="text-secondary small">Newly submitted complaints per day</span>
              </div>
              <div 
                className="d-flex align-items-center gap-1 p-1 rounded"
                style={{ 
                  background: '#09142A', 
                  border: '1px solid rgba(59, 130, 246, 0.2)' 
                }}
              >
                <Button
                  size="sm"
                  variant={trendDays === 7 ? 'primary' : 'link'}
                  className={`rounded px-2 py-1 fw-semibold text-nowrap text-decoration-none ${trendDays === 7 ? 'text-white' : 'text-secondary'}`}
                  style={{ fontSize: '11px' }}
                  onClick={() => handleFilterChange(7)}
                  disabled={trendLoading}
                >
                  Last 7 Days
                </Button>
                <Button
                  size="sm"
                  variant={trendDays === 30 ? 'primary' : 'link'}
                  className={`rounded px-2 py-1 fw-semibold text-nowrap text-decoration-none ${trendDays === 30 ? 'text-white' : 'text-secondary'}`}
                  style={{ fontSize: '11px' }}
                  onClick={() => handleFilterChange(30)}
                  disabled={trendLoading}
                >
                  Last 30 Days
                </Button>
              </div>
            </Card.Header>
            <Card.Body className="p-3 pt-2 position-relative">
              {trendLoading && (
                <div
                  className="position-absolute top-0 start-0 w-100 h-100 d-flex justify-content-center align-items-center rounded"
                  style={{ zIndex: 5, background: 'rgba(14, 27, 56, 0.75)' }}
                >
                  <Spinner animation="border" size="sm" variant="info" className="me-2" />
                  <span className="small text-white-50 fw-semibold">Updating trend...</span>
                </div>
              )}
              <div style={{ width: '100%', height: 320 }}>
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart
                    data={dailyTrendData}
                    margin={{ top: 25, right: 20, left: -10, bottom: trendDays === 30 ? 35 : 20 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(255, 255, 255, 0.08)" />
                    <XAxis
                      dataKey="formatted_date"
                      stroke="rgba(255, 255, 255, 0.4)"
                      interval={trendDays === 30 ? 2 : 0}
                      tick={({ x, y, payload }) => (
                        <g transform={`translate(${x},${y})`}>
                          <text
                            x={0}
                            y={0}
                            dy={12}
                            textAnchor={trendDays === 30 ? 'end' : 'middle'}
                            fill="rgba(255, 255, 255, 0.75)"
                            fontSize={11}
                            fontWeight={500}
                            transform={trendDays === 30 ? 'rotate(-35)' : undefined}
                          >
                            {payload.value}
                          </text>
                        </g>
                      )}
                    />
                    <YAxis
                      allowDecimals={false}
                      stroke="rgba(255, 255, 255, 0.4)"
                      tick={{ fontSize: 12, fill: 'rgba(255, 255, 255, 0.75)' }}
                    />
                    <Tooltip
                      content={({ active, payload }) => {
                        if (active && payload && payload.length) {
                          const item = payload[0].payload;
                          return (
                            <div 
                              className="px-3 py-2 rounded shadow-lg" 
                              style={{ 
                                fontSize: '13px',
                                background: 'rgba(10, 24, 52, 0.95)',
                                border: '1px solid rgba(59, 130, 246, 0.35)',
                                color: '#ffffff'
                              }}
                            >
                              <p className="fw-bold mb-1 text-white border-bottom border-white border-opacity-10 pb-1">
                                {item.date} ({item.formatted_date})
                              </p>
                              <p className="mb-0 text-white-50 d-flex justify-content-between align-items-center">
                                <span>New Complaints:</span>
                                <span className="fw-bold text-info ms-2 fs-6">{item.count}</span>
                              </p>
                            </div>
                          );
                        }
                        return null;
                      }}
                    />
                    <Line
                      type="monotone"
                      dataKey="count"
                      stroke="#38BDF8"
                      strokeWidth={3}
                      dot={{ r: 4, fill: '#2563EB', stroke: '#38BDF8', strokeWidth: 2 }}
                      activeDot={{ r: 6, fill: '#38BDF8', stroke: '#ffffff', strokeWidth: 2 }}
                    >
                      <LabelList
                        dataKey="count"
                        position="top"
                        formatter={(val) => (val > 0 ? val : (trendDays === 7 ? '0' : ''))}
                        style={{ fill: '#F8FAFC', fontWeight: 600, fontSize: 11 }}
                      />
                    </Line>
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </Card.Body>
          </Card>
        </Col>
      </Row>
    </div>
  );
};

export default AnalyticsSection;
