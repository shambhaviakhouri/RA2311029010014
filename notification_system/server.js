require('dotenv').config();

const express = require('express');
const LoggingMiddleware = require('../LoggingMiddleware');
const { BulkNotificationService } = require('./BulkNotificationService');
const { PriorityInbox } = require('./PriorityInbox');

const app = express();
const bulkNotificationService = new BulkNotificationService();

app.use(LoggingMiddleware.middleware());
app.use(express.json());

LoggingMiddleware.info('Notification API Server started');

const mockNotifications = [
  {
    ID: '88855132-142b4bbc-8578-00foc55010d',
    Type: 'Result',
    Message: 'old-som',
    Timestamp: new Date(Date.now() - 5 * 60000).toISOString(),
    read: false
  },
  {
    ID: '02836725-25-4F21-a72F-54436f837F',
    Type: 'Placement',
    Message: 'CSK Corporation Hiring',
    Timestamp: new Date(Date.now() - 2 * 60000).toISOString(),
    read: false
  },
  {
    ID: '083cb427-8fc6-47F7-bbee-be228f6hedac',
    Type: 'Event',
    Message: 'farewell',
    Timestamp: new Date(Date.now() - 10 * 60000).toISOString(),
    read: false
  },
  {
    ID: '88855132-142b4bbc-8578-00foc55010d',
    Type: 'Result',
    Message: 'old-som',
    Timestamp: new Date(Date.now() - 8 * 60000).toISOString(),
    read: false
  },
  {
    ID: '02836725-25-4F21-a72F-54436f837F',
    Type: 'Result',
    Message: 'project-review',
    Timestamp: new Date(Date.now() - 3 * 60000).toISOString(),
    read: false
  },
  {
    ID: '083cb427-8fc6-47F7-bbee-be228f6hedac',
    Type: 'Result',
    Message: 'external',
    Timestamp: new Date(Date.now() - 12 * 60000).toISOString(),
    read: false
  },
  {
    ID: '05c4FF28-31bF-4940-8F02-72Fda5948918',
    Type: 'Result',
    Message: 'project-review',
    Timestamp: new Date(Date.now() - 1 * 3600000).toISOString(),
    read: false
  },
  {
    ID: 'c3F2885a6-45ac-4b00-b548-600c9d4c52c8',
    Type: 'Event',
    Message: 'tech-fest',
    Timestamp: new Date(Date.now() - 15 * 60000).toISOString(),
    read: false
  },
  {
    ID: 'abc123',
    Type: 'Placement',
    Message: 'Advanced Micro Devices Inc. hiring',
    Timestamp: new Date(Date.now() - 20 * 60000).toISOString(),
    read: false
  },
  {
    ID: 'def456',
    Type: 'Placement',
    Message: 'Google Recruitment Drive',
    Timestamp: new Date(Date.now() - 1 * 60000).toISOString(),
    read: false
  },
  {
    ID: 'ghi789',
    Type: 'Result',
    Message: 'Coding Test Results',
    Timestamp: new Date(Date.now() - 30 * 60000).toISOString(),
    read: false
  },
  {
    ID: 'jkl012',
    Type: 'Event',
    Message: 'Campus Fest Registration',
    Timestamp: new Date(Date.now() - 45 * 60000).toISOString(),
    read: false
  }
];

app.get('/health', (req, res) => {
  LoggingMiddleware.info('Health check endpoint called');
  res.json({ status: 'ok', service: 'notification-api' });
});

app.get('/api/v1/notifications', (req, res) => {
  const page = parseInt(req.query.page) || 1;
  const limit = parseInt(req.query.limit) || 20;
  const type = req.query.type;

  LoggingMiddleware.info('Get notifications request', {
    page,
    limit,
    type: type || 'all'
  });

  let filtered = [...mockNotifications];

  if (type) {
    filtered = filtered.filter(n => n.Type === type);
  }

  const start = (page - 1) * limit;
  const paginatedNotifications = filtered.slice(start, start + limit);

  res.json({
    success: true,
    data: {
      notifications: paginatedNotifications,
      pagination: {
        page,
        limit,
        total: filtered.length,
        totalPages: Math.ceil(filtered.length / limit)
      }
    }
  });
});

app.get('/api/v1/notifications/unread', (req, res) => {
  const limit = parseInt(req.query.limit) || 50;

  LoggingMiddleware.info('Get unread notifications request', { limit });

  const unreadNotifications = mockNotifications
    .filter(n => !n.read)
    .slice(0, limit);

  res.json({
    success: true,
    data: {
      notifications: unreadNotifications,
      unreadCount: mockNotifications.filter(n => !n.read).length
    }
  });
});

app.get('/api/v1/notifications/unread/count', (req, res) => {
  LoggingMiddleware.info('Get unread count request');

  const byType = {
    'Placement': mockNotifications.filter(n => !n.read && n.Type === 'Placement').length,
    'Result': mockNotifications.filter(n => !n.read && n.Type === 'Result').length,
    'Event': mockNotifications.filter(n => !n.read && n.Type === 'Event').length
  };

  res.json({
    success: true,
    data: {
      unreadCount: mockNotifications.filter(n => !n.read).length,
      byType
    }
  });
});

app.get('/api/v1/notifications/priority/top10', (req, res) => {
  LoggingMiddleware.info('Get top 10 priority notifications request');

  const inbox = new PriorityInbox(10);

  mockNotifications.forEach(notification => {
    inbox.addNotification(notification);
  });

  const topNotifications = inbox.getTopNotifications();

  res.json({
    success: true,
    data: {
      notifications: topNotifications,
      count: topNotifications.length,
      algorithm: 'Max Heap Priority Queue',
      scoring: {
        placement_weight: 3,
        result_weight: 2,
        event_weight: 1,
        recency_factor: true
      }
    }
  });
});

app.post('/api/v1/notifications/notify-all', async (req, res) => {
  const { student_ids, message, notification_type } = req.body;

  if (!student_ids || !Array.isArray(student_ids) || student_ids.length === 0) {
    LoggingMiddleware.warn('Invalid notify-all request', { error: 'Missing or invalid student_ids' });
    return res.status(400).json({
      success: false,
      error: {
        code: 'INVALID_REQUEST',
        message: 'student_ids must be a non-empty array'
      }
    });
  }

  if (!message) {
    LoggingMiddleware.warn('Invalid notify-all request', { error: 'Missing message' });
    return res.status(400).json({
      success: false,
      error: {
        code: 'INVALID_REQUEST',
        message: 'message is required'
      }
    });
  }

  try {
    LoggingMiddleware.info('Notify all request received', {
      studentCount: student_ids.length,
      message: message,
      type: notification_type || 'Placement'
    });

    const result = await bulkNotificationService.notifyAll(
      student_ids,
      message,
      notification_type || 'Placement'
    );

    res.status(202).json({
      success: true,
      data: result
    });
  } catch (error) {
    LoggingMiddleware.error('Error in notify-all endpoint', { error: error.message });
    res.status(500).json({
      success: false,
      error: {
        code: 'INTERNAL_ERROR',
        message: 'An error occurred while processing the request'
      }
    });
  }
});

app.get('/api/v1/notifications/job/:jobId', (req, res) => {
  const { jobId } = req.params;

  LoggingMiddleware.info('Get job status request', { jobId });

  const jobStatus = bulkNotificationService.getJobStatus(jobId);

  if (!jobStatus) {
    LoggingMiddleware.warn('Job not found', { jobId });
    return res.status(404).json({
      success: false,
      error: {
        code: 'NOT_FOUND',
        message: 'Job not found'
      }
    });
  }

  res.json({
    success: true,
    data: jobStatus
  });
});

app.put('/api/v1/notifications/:notificationId/read', (req, res) => {
  const { notificationId } = req.params;

  LoggingMiddleware.info('Mark notification as read', { notificationId });

  const notification = mockNotifications.find(n => n.ID === notificationId);

  if (!notification) {
    return res.status(404).json({
      success: false,
      error: {
        code: 'NOT_FOUND',
        message: 'Notification not found'
      }
    });
  }

  notification.read = true;

  res.json({
    success: true,
    data: {
      id: notificationId,
      read: true,
      updatedAt: new Date().toISOString()
    }
  });
});

app.put('/api/v1/notifications/batch/read', (req, res) => {
  const { notificationIds } = req.body;

  if (!notificationIds || !Array.isArray(notificationIds)) {
    return res.status(400).json({
      success: false,
      error: {
        code: 'INVALID_REQUEST',
        message: 'notificationIds must be an array'
      }
    });
  }

  LoggingMiddleware.info('Batch mark as read request', { count: notificationIds.length });

  let updated = 0;
  notificationIds.forEach(id => {
    const notification = mockNotifications.find(n => n.ID === id);
    if (notification) {
      notification.read = true;
      updated++;
    }
  });

  res.json({
    success: true,
    data: {
      updated,
      updatedAt: new Date().toISOString()
    }
  });
});

app.delete('/api/v1/notifications/:notificationId', (req, res) => {
  const { notificationId } = req.params;

  LoggingMiddleware.info('Delete notification request', { notificationId });

  const index = mockNotifications.findIndex(n => n.ID === notificationId);

  if (index === -1) {
    return res.status(404).json({
      success: false,
      error: {
        code: 'NOT_FOUND',
        message: 'Notification not found'
      }
    });
  }

  mockNotifications.splice(index, 1);

  res.json({
    success: true,
    data: {
      message: 'Notification deleted successfully'
    }
  });
});

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
  LoggingMiddleware.info('Notification API Server listening', { port: PORT });
  console.log(`\nNotification API Server running on http://localhost:${PORT}`);
  console.log('Available endpoints:');
  console.log('  GET /health');
  console.log('  GET /api/v1/notifications');
  console.log('  GET /api/v1/notifications/unread');
  console.log('  GET /api/v1/notifications/unread/count');
  console.log('  GET /api/v1/notifications/priority/top10');
  console.log('  POST /api/v1/notifications/notify-all');
  console.log('  GET /api/v1/notifications/job/:jobId');
  console.log('  PUT /api/v1/notifications/:notificationId/read');
  console.log('  PUT /api/v1/notifications/batch/read');
  console.log('  DELETE /api/v1/notifications/:notificationId');
});
