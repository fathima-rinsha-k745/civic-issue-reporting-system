import React, { useState, useEffect, useRef } from 'react';
import { Dropdown, Badge, Button, Spinner } from 'react-bootstrap';
import { FaBell, FaCheckDouble, FaExclamationCircle } from 'react-icons/fa';
import { useNavigate } from 'react-router-dom';
import { api } from '../../services/api';

const NotificationBell = ({ userRole = 'CITIZEN' }) => {
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const navigate = useNavigate();

  const fetchNotificationData = async () => {
    try {
      const [count, list] = await Promise.all([
        api.getUnreadNotificationCount(),
        api.getNotifications()
      ]);
      setUnreadCount(count);
      setNotifications(Array.isArray(list) ? list : []);
    } catch (err) {
      console.warn("Failed to fetch notifications:", err);
    }
  };

  useEffect(() => {
    fetchNotificationData();
    // Refresh every 30 seconds
    const interval = setInterval(fetchNotificationData, 30000);
    return () => clearInterval(interval);
  }, []);

  const handleToggle = (nextOpen) => {
    setIsOpen(nextOpen);
    if (nextOpen) {
      fetchNotificationData();
    }
  };

  const handleNotificationClick = async (notif) => {
    try {
      if (!notif.is_read) {
        await api.markNotificationRead(notif.id);
        setNotifications(prev =>
          prev.map(n => n.id === notif.id ? { ...n, is_read: true } : n)
        );
        setUnreadCount(prev => Math.max(0, prev - 1));
      }
    } catch (err) {
      console.error("Error marking notification read:", err);
    }

    setIsOpen(false);

    if (notif.complaint) {
      if (userRole === 'CITIZEN') {
        navigate(`/dashboard/citizen/complaints/${notif.complaint}`);
      } else if (userRole === 'DEPARTMENT_STAFF') {
        navigate(`/dashboard/department_staff/complaints/${notif.complaint}`);
      } else if (userRole === 'MUNICIPAL_AUTHORITY') {
        navigate(`/dashboard/municipal_authority/complaints/${notif.complaint}`);
      }
    }
  };

  const handleMarkAllRead = async (e) => {
    e.stopPropagation();
    try {
      await api.markAllNotificationsRead();
      setNotifications(prev => prev.map(n => ({ ...n, is_read: true })));
      setUnreadCount(0);
    } catch (err) {
      console.error("Error marking all read:", err);
    }
  };

  return (
    <Dropdown show={isOpen} onToggle={handleToggle} align="end" className="me-3">
      <Dropdown.Toggle
        as="button"
        className="btn btn-link p-0 position-relative text-secondary border-0 bg-transparent"
        style={{ cursor: 'pointer', outline: 'none' }}
        aria-label="Notifications"
      >
        <FaBell size={22} className="text-secondary" />
        {unreadCount > 0 && (
          <span 
            className="position-absolute top-0 start-100 translate-middle badge rounded-pill bg-danger"
            style={{ fontSize: '0.65rem', padding: '0.25em 0.5em' }}
          >
            {unreadCount > 99 ? '99+' : unreadCount}
          </span>
        )}
      </Dropdown.Toggle>

      <Dropdown.Menu
        className="shadow-lg border-0 p-0 notification-dropdown-menu"
        style={{ width: 'min(340px, calc(100vw - 24px))', maxHeight: '460px', overflowY: 'auto', zIndex: 1050 }}
      >
        <div className="p-3 bg-light border-bottom d-flex justify-content-between align-items-center">
          <span className="fw-bold text-dark mb-0 d-flex align-items-center">
            Notifications
            {unreadCount > 0 && (
              <Badge bg="primary" pill className="ms-2" style={{ fontSize: '0.75rem' }}>
                {unreadCount} new
              </Badge>
            )}
          </span>
          {unreadCount > 0 && (
            <Button
              variant="link"
              size="sm"
              className="p-0 text-decoration-none small text-primary"
              onClick={handleMarkAllRead}
            >
              <FaCheckDouble className="me-1" /> Mark all read
            </Button>
          )}
        </div>

        {notifications.length === 0 ? (
          <div className="text-center py-4 text-muted small">
            No notifications yet
          </div>
        ) : (
          <div className="list-group list-group-flush">
            {notifications.slice(0, 15).map((n) => (
              <button
                key={n.id}
                type="button"
                className={`list-group-item list-group-item-action text-start p-3 border-bottom ${
                  !n.is_read ? 'bg-light-blue fw-medium' : 'bg-white'
                }`}
                onClick={() => handleNotificationClick(n)}
                style={{ cursor: 'pointer' }}
              >
                <div className="d-flex justify-content-between align-items-start mb-1">
                  <span className={`small ${!n.is_read ? 'fw-bold text-primary' : 'text-dark'}`}>
                    {n.title}
                  </span>
                  {!n.is_read && (
                    <span 
                      className="badge rounded-circle bg-primary p-1 ms-1" 
                      style={{ width: '8px', height: '8px' }}
                    ></span>
                  )}
                </div>
                <p className="small text-muted mb-1 lh-sm" style={{ fontSize: '0.82rem' }}>
                  {n.message}
                </p>
                {n.created_at_formatted && (
                  <div className="text-secondary" style={{ fontSize: '0.7rem' }}>
                    {n.created_at_formatted}
                  </div>
                )}
              </button>
            ))}
          </div>
        )}
      </Dropdown.Menu>
    </Dropdown>
  );
};

export default NotificationBell;
