require('dotenv').config();

const { NotificationStreamManager } = require('./PriorityInbox');
const LoggingMiddleware = require('../LoggingMiddleware');

const API_URL = process.env.API_BASE_URL || 'http://20.207.122.201';
const API_TOKEN = process.env.API_KEY || 'Bearer YOUR_TOKEN_HERE';

async function main() {
  try {
    LoggingMiddleware.info('Priority Inbox Demo started');

    const manager = new NotificationStreamManager(
      `${API_URL}/evaluation-service/notifications`,
      API_TOKEN
    );

    console.log('\n========== FETCHING AND PROCESSING NOTIFICATIONS ==========\n');

    const topNotifications = await manager.updateInbox();

    console.log(`Total Top Priority Notifications: ${topNotifications.length}\n`);
    console.log('========== TOP 10 PRIORITY INBOX ==========\n');

    if (topNotifications.length === 0) {
      console.log('No priority notifications found.\n');
    } else {
      topNotifications.forEach((notification, index) => {
        const weightLabels = {
          3: 'Placement',
          2: 'Result',
          1: 'Event'
        };

        const weightLabel = weightLabels[notification.weight] || 'Unknown';
        const timestamp = new Date(notification.Timestamp);
        const ageMinutes = notification.ageSeconds / 60;

        console.log(`${index + 1}. [${weightLabel.toUpperCase()}] - Priority Score: ${notification.priorityScore.toFixed(2)}`);
        console.log(`   ID: ${notification.ID}`);
        console.log(`   Message: ${notification.Message}`);
        console.log(`   Timestamp: ${timestamp.toISOString()}`);
        console.log(`   Age: ${ageMinutes.toFixed(2)} minutes ago`);
        console.log(`   Weight: ${notification.weight}/3`);
        console.log(`   Read: ${notification.read ? 'Yes' : 'No'}`);
        console.log('');
      });
    }

    console.log('========== PRIORITY CALCULATION ==========\n');
    console.log('Priority Score Formula:');
    console.log('  score = (weight × 1000) + max(0, 10000 - age_seconds)\n');
    console.log('Weight Distribution:');
    console.log('  - Placement notifications: weight = 3 (highest priority)');
    console.log('  - Result notifications: weight = 2 (medium priority)');
    console.log('  - Event notifications: weight = 1 (lowest priority)\n');
    console.log('Recency Factor:');
    console.log('  - Newer notifications get higher scores');
    console.log('  - Recency bonus decreases by 1 point per second\n');

    if (topNotifications.length > 0) {
      const topNotif = topNotifications[0];
      const scoringInfo = manager.inbox.calculatePriorityScore(topNotif);

      console.log('Example - Top Notification Scoring:');
      console.log(`  Type: ${topNotif.Type}`);
      console.log(`  Weight: ${scoringInfo.weight}`);
      console.log(`  Age: ${scoringInfo.ageSeconds.toFixed(2)} seconds`);
      console.log(`  Recency Bonus: ${scoringInfo.recencyScore.toFixed(2)}`);
      console.log(`  Final Priority Score: ${scoringInfo.priorityScore.toFixed(2)}\n`);
    }

    LoggingMiddleware.info('Priority Inbox Demo completed', {
      topNotificationsCount: topNotifications.length
    });

  } catch (error) {
    LoggingMiddleware.error('Application error', { error: error.message });
    console.error('Error:', error.message);
    process.exit(1);
  }
}

main();
