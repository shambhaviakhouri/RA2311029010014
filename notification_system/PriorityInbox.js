const axios = require('axios');
const LoggingMiddleware = require('../LoggingMiddleware');

class PriorityInbox {
  constructor(maxSize = 10) {
    this.maxSize = maxSize;
    this.heap = [];
  }

  getWeight(type) {
    const weights = {
      'Placement': 3,
      'Result': 2,
      'Event': 1
    };
    return weights[type] || 0;
  }

  calculatePriorityScore(notification) {
    const weight = this.getWeight(notification.Type);
    const timestamp = new Date(notification.Timestamp).getTime();
    const ageMs = Date.now() - timestamp;
    const ageSeconds = ageMs / 1000;
    const recencyScore = Math.max(0, 10000 - ageSeconds);
    const priorityScore = weight * 1000 + recencyScore;

    return {
      weight,
      ageSeconds,
      recencyScore,
      priorityScore
    };
  }

  addNotification(notification) {
    if (notification.read === true) {
      return;
    }

    const scoringInfo = this.calculatePriorityScore(notification);
    const priorityNotification = {
      ...notification,
      weight: scoringInfo.weight,
      priorityScore: scoringInfo.priorityScore,
      ageSeconds: scoringInfo.ageSeconds
    };

    if (this.heap.length < this.maxSize) {
      this.heap.push(priorityNotification);
      this.bubbleUp(this.heap.length - 1);
    } else if (priorityNotification.priorityScore > this.getMinPriority()) {
      this.heap[0] = priorityNotification;
      this.bubbleDown(0);
    }

    LoggingMiddleware.debug('Notification added to priority inbox', {
      notificationId: notification.ID,
      type: notification.Type,
      heapSize: this.heap.length,
      priorityScore: scoringInfo.priorityScore
    });
  }

  bubbleUp(index) {
    while (index > 0) {
      const parentIndex = Math.floor((index - 1) / 2);
      if (this.compare(this.heap[index], this.heap[parentIndex]) > 0) {
        [this.heap[index], this.heap[parentIndex]] = [this.heap[parentIndex], this.heap[index]];
        index = parentIndex;
      } else {
        break;
      }
    }
  }

  bubbleDown(index) {
    while (true) {
      let smallest = index;
      const left = 2 * index + 1;
      const right = 2 * index + 2;

      if (left < this.heap.length && this.compare(this.heap[left], this.heap[smallest]) > 0) {
        smallest = left;
      }

      if (right < this.heap.length && this.compare(this.heap[right], this.heap[smallest]) > 0) {
        smallest = right;
      }

      if (smallest !== index) {
        [this.heap[index], this.heap[smallest]] = [this.heap[smallest], this.heap[index]];
        index = smallest;
      } else {
        break;
      }
    }
  }

  compare(a, b) {
    if (a.weight !== b.weight) {
      return a.weight - b.weight;
    }
    const aTime = new Date(a.Timestamp).getTime();
    const bTime = new Date(b.Timestamp).getTime();
    return bTime - aTime;
  }

  getMinPriority() {
    return this.heap.length > 0 ? this.heap[0].priorityScore : 0;
  }

  getTopNotifications() {
    const sorted = [...this.heap].sort((a, b) => {
      const weightDiff = b.weight - a.weight;
      if (weightDiff !== 0) return weightDiff;
      const aTime = new Date(a.Timestamp).getTime();
      const bTime = new Date(b.Timestamp).getTime();
      return bTime - aTime;
    });

    return sorted;
  }

  clear() {
    this.heap = [];
  }

  size() {
    return this.heap.length;
  }
}

class NotificationStreamManager {
  constructor(apiUrl, apiToken) {
    this.apiUrl = apiUrl;
    this.apiToken = apiToken;
    this.inbox = new PriorityInbox(10);
    this.pollingInterval = null;
  }

  async fetchNotifications() {
    try {
      LoggingMiddleware.info('Fetching notifications from API');

      const response = await axios.get(this.apiUrl, {
        headers: {
          'Authorization': `Bearer ${this.apiToken}`
        }
      });

      LoggingMiddleware.info('Notifications fetched successfully', {
        count: response.data.notifications.length
      });

      return response.data.notifications;
    } catch (error) {
      LoggingMiddleware.error('Error fetching notifications', {
        error: error.message
      });
      return [];
    }
  }

  async updateInbox() {
    try {
      const notifications = await this.fetchNotifications();
      this.inbox.clear();

      for (const notification of notifications) {
        this.inbox.addNotification(notification);
      }

      LoggingMiddleware.info('Inbox updated', {
        topNotificationsCount: this.inbox.size()
      });

      return this.getTopNotifications();
    } catch (error) {
      LoggingMiddleware.error('Error updating inbox', {
        error: error.message
      });
      return [];
    }
  }

  getTopNotifications() {
    return this.inbox.getTopNotifications();
  }

  startPolling(intervalMs = 5000) {
    LoggingMiddleware.info('Starting notification polling', { intervalMs });

    this.pollingInterval = setInterval(async () => {
      await this.updateInbox();
    }, intervalMs);
  }

  stopPolling() {
    if (this.pollingInterval) {
      clearInterval(this.pollingInterval);
      this.pollingInterval = null;
      LoggingMiddleware.info('Notification polling stopped');
    }
  }
}

module.exports = { PriorityInbox, NotificationStreamManager };
