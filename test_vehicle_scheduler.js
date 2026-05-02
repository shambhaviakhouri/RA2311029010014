class VehicleScheduler {
  solveKnapsack(vehicles, capacity) {
    const n = vehicles.length;
    const dp = Array(capacity + 1).fill(0);
    const selected = {};

    for (let i = 0; i < n; i++) {
      const vehicle = vehicles[i];
      for (let w = capacity; w >= vehicle.Duration; w--) {
        const newValue = dp[w - vehicle.Duration] + vehicle.Impact;
        if (newValue > dp[w]) {
          dp[w] = newValue;
        }
      }
    }

    let remainingCapacity = capacity;
    for (let i = n - 1; i >= 0; i--) {
      const vehicle = vehicles[i];
      if (remainingCapacity >= vehicle.Duration && 
          dp[remainingCapacity] === dp[remainingCapacity - vehicle.Duration] + vehicle.Impact) {
        selected[vehicle.TaskID] = vehicle;
        remainingCapacity -= vehicle.Duration;
      }
    }

    return {
      maxImpact: dp[capacity],
      selectedVehicles: Object.values(selected),
      usedHours: capacity - remainingCapacity,
      remainingHours: remainingCapacity
    };
  }
}

const sampleVehicles = [
  { TaskID: 'V001', Duration: 2, Impact: 5 },
  { TaskID: 'V002', Duration: 3, Impact: 8 },
  { TaskID: 'V003', Duration: 1, Impact: 3 },
  { TaskID: 'V004', Duration: 5, Impact: 10 }
];

const sampleDepots = [
  { ID: 1, Hours: 10 },
  { ID: 2, Hours: 15 }
];

const scheduler = new VehicleScheduler();

console.log('Testing Vehicle Scheduler\n');

sampleDepots.forEach(depot => {
  const solution = scheduler.solveKnapsack(sampleVehicles, depot.Hours);
  console.log(`Depot ${depot.ID}: Impact=${solution.maxImpact}, Used=${solution.usedHours}h`);
  console.log(`  Selected: ${solution.selectedVehicles.map(v => v.TaskID).join(', ')}`);
});
