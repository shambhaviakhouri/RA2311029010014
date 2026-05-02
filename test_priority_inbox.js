class MaxHeap {
  constructor(maxSize = 10) {
    this.maxSize = maxSize;
    this.heap = [];
  }

  add(item) {
    this.heap.push(item);
    this.heap.sort((a, b) => b.score - a.score);
    if (this.heap.length > this.maxSize) {
      this.heap.pop();
    }
  }

  getTop() {
    return this.heap;
  }
}

const inbox = new MaxHeap(10);

const notifications = [
  { id: 1, type: 'Placement', score: 95 },
  { id: 2, type: 'Result', score: 85 },
  { id: 3, type: 'Event', score: 75 },
  { id: 4, type: 'Placement', score: 98 },
  { id: 5, type: 'Result', score: 88 }
];

console.log('Testing Priority Inbox\n');

notifications.forEach(notif => {
  inbox.add(notif);
});

const topNotifications = inbox.getTop();

console.log(`Total notifications: ${notifications.length}`);
console.log(`Top notifications: ${topNotifications.length}\n`);

console.log('Top Notifications:');
topNotifications.forEach((notif, idx) => {
  console.log(`${idx + 1}. [${notif.type}] Score: ${notif.score}`);
});
