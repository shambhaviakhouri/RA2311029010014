const LoggingMiddleware = require('../LoggingMiddleware');

class NotificationQueue {
  constructor() {
    this.queue = [];
    this.processing = false;
  }

  push(job) {
    LoggingMiddleware.info('Job pushed to queue', { jobId: job.id });
    this.queue.push(job);
    if (!this.processing) {
      this.processQueue();
    }
  }

  async processQueue() {
    if (this.processing || this.queue.length === 0) {
      return;
    }

    this.processing = true;

    while (this.queue.length > 0) {
      const job = this.queue.shift();
      await this.processJob(job);
    }

    this.processing = false;
  }

  async processJob(job) {
    LoggingMiddleware.info('Processing notification job', { 
      jobId: job.id,
      totalStudents: job.student_ids.length 
    });

    const batchSize = 1000;
    const batches = this.chunkArray(job.student_ids, batchSize);

    for (let i = 0; i < batches.length; i++) {
      const batch = batches[i];
      LoggingMiddleware.info('Processing batch', {
        jobId: job.id,
        batchNumber: i + 1,
        totalBatches: batches.length,
        batchSize: batch.length
      });

      await this.processBatch(job, batch);
    }

    job.status = 'completed';
    job.completed_at = new Date().toISOString();
    LoggingMiddleware.info('Job completed', { jobId: job.id });
  }

  async processBatch(job, studentIds) {
    try {
      const notifications = studentIds.map(studentId => ({
        user_id: studentId,
        type: job.notificationType || 'Placement',
        message: job.message,
        timestamp: new Date().toISOString(),
        priority: this.getPriority(job.notificationType),
        read: false
      }));

      LoggingMiddleware.debug('Batch notifications created', {
        count: notifications.length
      });

      await this.insertNotifications(notifications);
      
      LoggingMiddleware.info('Batch notifications inserted', {
        count: notifications.length
      });

    } catch (error) {
      LoggingMiddleware.error('Error processing batch', {
        error: error.message,
        studentCount: studentIds.length
      });
    }
  }

  async insertNotifications(notifications) {
    return new Promise((resolve) => {
      setTimeout(() => {
        resolve(notifications.length);
      }, 100);
    });
  }

  getPriority(type) {
    const priorities = {
      'Placement': 3,
      'Result': 2,
      'Event': 1
    };
    return priorities[type] || 1;
  }

  chunkArray(array, size) {
    const chunks = [];
    for (let i = 0; i < array.length; i += size) {
      chunks.push(array.slice(i, i + size));
    }
    return chunks;
  }
}

class BulkNotificationService {
  constructor() {
    this.queue = new NotificationQueue();
    this.jobs = new Map();
  }

  async notifyAll(studentIds, message, notificationType = 'Placement') {
    const jobId = this.generateJobId();

    const job = {
      id: jobId,
      student_ids: studentIds,
      message: message,
      notificationType: notificationType,
      status: 'queued',
      created_at: new Date().toISOString(),
      completed_at: null,
      total_students: studentIds.length,
      processed_count: 0
    };

    this.jobs.set(jobId, job);

    LoggingMiddleware.info('Notify all job created', {
      jobId: jobId,
      studentCount: studentIds.length,
      message: message
    });

    this.queue.push(job);

    return {
      status: 'accepted',
      job_id: jobId,
      total_students: studentIds.length,
      estimated_completion: '3 seconds',
      created_at: job.created_at
    };
  }

  getJobStatus(jobId) {
    const job = this.jobs.get(jobId);
    if (!job) {
      LoggingMiddleware.warn('Job not found', { jobId: jobId });
      return null;
    }

    const progress = job.total_students > 0 
      ? Math.round((job.processed_count / job.total_students) * 100)
      : 0;

    return {
      job_id: jobId,
      status: job.status,
      total_students: job.total_students,
      processed_count: job.processed_count,
      progress_percent: progress,
      created_at: job.created_at,
      completed_at: job.completed_at
    };
  }

  generateJobId() {
    return `job_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }
}

module.exports = { BulkNotificationService, NotificationQueue };
