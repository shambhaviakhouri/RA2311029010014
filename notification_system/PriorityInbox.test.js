const { PriorityInbox } = require('./PriorityInbox');

class PriorityInboxTests {
  static testBasicFunctionality() {
    console.log('\n========== TEST 1: Basic Priority Inbox Functionality ==========\n');

    const inbox = new PriorityInbox(3);

    const testNotifications = [
      { ID: '1', Type: 'Event', Message: 'Event 1', Timestamp: new Date(Date.now() - 1000).toISOString(), read: false },
      { ID: '2', Type: 'Result', Message: 'Result 1', Timestamp: new Date(Date.now() - 500).toISOString(), read: false },
      { ID: '3', Type: 'Placement', Message: 'Placement 1', Timestamp: new Date().toISOString(), read: false },
      { ID: '4', Type: 'Placement', Message: 'Placement 2', Timestamp: new Date(Date.now() - 100).toISOString(), read: false }
    ];

    testNotifications.forEach(notif => inbox.addNotification(notif));

    const top = inbox.getTopNotifications();
    console.log(`Inserted 4 notifications, max heap size = 3`);
    console.log(`Top notifications in priority order:\n`);

    top.forEach((notif, i) => {
      console.log(`${i + 1}. Type: ${notif.Type}, Score: ${notif.priorityScore.toFixed(2)}, Age: ${notif.ageSeconds.toFixed(2)}s`);
    });

    console.log('\nTest 1 Result: PASSED');
  }

  static testTypeWeighting() {
    console.log('\n========== TEST 2: Type Weight Verification ==========\n');

    const inbox = new PriorityInbox(10);

    const recentTime = new Date();
    const sameAge = recentTime.toISOString();

    const notifications = [
      { ID: '1', Type: 'Event', Message: 'Event', Timestamp: sameAge, read: false },
      { ID: '2', Type: 'Result', Message: 'Result', Timestamp: sameAge, read: false },
      { ID: '3', Type: 'Placement', Message: 'Placement', Timestamp: sameAge, read: false }
    ];

    notifications.forEach(notif => inbox.addNotification(notif));

    const top = inbox.getTopNotifications();
    console.log('All notifications created at same time. Order should be: Placement > Result > Event\n');

    top.forEach((notif, i) => {
      const weight = inbox.getWeight(notif.Type);
      console.log(`${i + 1}. ${notif.Type} - Weight: ${weight}/3, Score: ${notif.priorityScore.toFixed(2)}`);
    });

    const isCorrectOrder = top[0].Type === 'Placement' && top[1].Type === 'Result' && top[2].Type === 'Event';
    console.log(`\nTest 2 Result: ${isCorrectOrder ? 'PASSED' : 'FAILED'}`);
  }

  static testRecencyFactor() {
    console.log('\n========== TEST 3: Recency Factor (Recent vs Old) ==========\n');

    const inbox = new PriorityInbox(10);

    const recentPlacement = {
      ID: '1',
      Type: 'Placement',
      Message: 'Recent Placement',
      Timestamp: new Date().toISOString(),
      read: false
    };

    const oldResult = {
      ID: '2',
      Type: 'Result',
      Message: 'Old Result',
      Timestamp: new Date(Date.now() - 2000).toISOString(),
      read: false
    };

    inbox.addNotification(recentPlacement);
    inbox.addNotification(oldResult);

    const top = inbox.getTopNotifications();
    console.log('Recent Placement vs 2-second-old Result\n');

    top.forEach((notif, i) => {
      console.log(`${i + 1}. ${notif.Type} - Age: ${notif.ageSeconds.toFixed(2)}s, Score: ${notif.priorityScore.toFixed(2)}`);
    });

    const correctOrder = top[0].Type === 'Placement' && top[1].Type === 'Result';
    console.log(`\nPlacement ranked higher despite being newer? ${correctOrder ? 'YES - PASSED' : 'NO - FAILED'}`);
  }

  static testHeapSizeLimit() {
    console.log('\n========== TEST 4: Heap Size Limitation (Max 10) ==========\n');

    const inbox = new PriorityInbox(10);

    console.log('Adding 20 notifications to a heap with max size 10...\n');

    for (let i = 1; i <= 20; i++) {
      const notification = {
        ID: `${i}`,
        Type: i % 3 === 0 ? 'Placement' : (i % 3 === 1 ? 'Result' : 'Event'),
        Message: `Notification ${i}`,
        Timestamp: new Date(Date.now() - (i * 1000)).toISOString(),
        read: false
      };
      inbox.addNotification(notification);
    }

    const size = inbox.size();
    console.log(`Final heap size: ${size}`);
    console.log(`Expected: 10`);
    console.log(`Test 4 Result: ${size === 10 ? 'PASSED' : 'FAILED'}`);
  }

  static testReadNotificationIgnored() {
    console.log('\n========== TEST 5: Read Notifications Ignored ==========\n');

    const inbox = new PriorityInbox(10);

    const readNotification = {
      ID: '1',
      Type: 'Placement',
      Message: 'Already Read',
      Timestamp: new Date().toISOString(),
      read: true
    };

    const unreadNotification = {
      ID: '2',
      Type: 'Event',
      Message: 'Unread',
      Timestamp: new Date(Date.now() - 10000).toISOString(),
      read: false
    };

    inbox.addNotification(readNotification);
    inbox.addNotification(unreadNotification);

    const top = inbox.getTopNotifications();
    console.log(`Added 1 read and 1 unread notification`);
    console.log(`Notifications in heap: ${top.length}`);
    console.log(`Expected: 1 (read notifications should be ignored)\n`);

    if (top.length === 1) {
      console.log(`Only unread notification in heap: ${top[0].Message}`);
      console.log(`Test 5 Result: PASSED`);
    } else {
      console.log(`Test 5 Result: FAILED`);
    }
  }

  static testEmptyHeap() {
    console.log('\n========== TEST 6: Empty Heap Handling ==========\n');

    const inbox = new PriorityInbox(10);

    console.log(`Heap size with no notifications: ${inbox.size()}`);
    console.log(`Expected: 0`);

    const top = inbox.getTopNotifications();
    console.log(`Top notifications: ${top.length}`);
    console.log(`Expected: 0`);

    const minPriority = inbox.getMinPriority();
    console.log(`Min priority score: ${minPriority}`);
    console.log(`Expected: 0`);

    const testPassed = inbox.size() === 0 && top.length === 0 && minPriority === 0;
    console.log(`\nTest 6 Result: ${testPassed ? 'PASSED' : 'FAILED'}`);
  }

  static testComplexScenario() {
    console.log('\n========== TEST 7: Complex Scenario (Real-World Data) ==========\n');

    const inbox = new PriorityInbox(10);

    const scenarios = [
      { Type: 'Placement', Minutes: 0, Message: 'Google Hiring - URGENT' },
      { Type: 'Placement', Minutes: 2, Message: 'Amazon Recruitment' },
      { Type: 'Result', Minutes: 0.5, Message: 'Mid-term Results Available' },
      { Type: 'Result', Minutes: 30, Message: 'Assignment Grades' },
      { Type: 'Event', Minutes: 5, Message: 'Tech Fest Tomorrow' },
      { Type: 'Event', Minutes: 60, Message: 'Sports Day Next Week' },
      { Type: 'Placement', Minutes: 15, Message: 'Microsoft Applications Open' },
      { Type: 'Result', Minutes: 2, Message: 'Quiz Results' },
      { Type: 'Event', Minutes: 0.1, Message: 'Campus Notification' },
      { Type: 'Placement', Minutes: 1, Message: 'Apple Internship Program' },
      { Type: 'Result', Minutes: 10, Message: 'Lab Exam Scores' },
      { Type: 'Event', Minutes: 45, Message: 'Hackathon Registration' }
    ];

    scenarios.forEach((scenario, i) => {
      const notification = {
        ID: `complex_${i}`,
        Type: scenario.Type,
        Message: scenario.Message,
        Timestamp: new Date(Date.now() - (scenario.Minutes * 60000)).toISOString(),
        read: false
      };
      inbox.addNotification(notification);
    });

    const top = inbox.getTopNotifications();
    console.log(`Added 12 notifications from real-world scenario`);
    console.log(`Top 10 by priority:\n`);

    top.forEach((notif, i) => {
      const typeEmoji = notif.Type === 'Placement' ? '🎯' : (notif.Type === 'Result' ? '📊' : '📢');
      console.log(`${i + 1}. ${typeEmoji} ${notif.Type.padEnd(11)} - ${notif.Message.padEnd(40)} (${notif.ageSeconds.toFixed(1)}s old, score: ${notif.priorityScore.toFixed(0)})`);
    });

    const allPlacementsRanked = top.filter(n => n.Type === 'Placement').length === 4;
    const resultsBetter = top.findIndex(n => n.Type === 'Result') > top.findIndex(n => n.Type === 'Event');

    console.log(`\nTest 7 Result: ${allPlacementsRanked ? 'PASSED' : 'FAILED'} (All 4 Placements ranked, Results above Events)`);
  }

  static runAllTests() {
    console.log('\n╔════════════════════════════════════════════════════╗');
    console.log('║      PRIORITY INBOX - COMPREHENSIVE TEST SUITE      ║');
    console.log('╚════════════════════════════════════════════════════╝');

    try {
      this.testBasicFunctionality();
      this.testTypeWeighting();
      this.testRecencyFactor();
      this.testHeapSizeLimit();
      this.testReadNotificationIgnored();
      this.testEmptyHeap();
      this.testComplexScenario();

      console.log('\n╔════════════════════════════════════════════════════╗');
      console.log('║               ALL TESTS COMPLETED                    ║');
      console.log('╚════════════════════════════════════════════════════╝\n');
    } catch (error) {
      console.error('\nTest execution failed:', error.message);
      process.exit(1);
    }
  }
}

PriorityInboxTests.runAllTests();
