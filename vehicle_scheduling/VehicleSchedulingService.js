const axios = require('axios');
const LoggingMiddleware = require('../LoggingMiddleware');

const API_BASE_URL = process.env.API_BASE_URL || 'http://20.207.122.201';
const API_HEADERS = {
  'Authorization': process.env.API_KEY || 'Bearer YOUR_TOKEN_HERE'
};

class VehicleSchedulingService {
  static async fetchDepots() {
    try {
      LoggingMiddleware.info('Fetching depots from API');
      const response = await axios.get(`${API_BASE_URL}/evaluation-service/depots`, {
        headers: API_HEADERS
      });
      LoggingMiddleware.info('Depots fetched successfully', { count: response.data.depots.length });
      return response.data.depots;
    } catch (error) {
      LoggingMiddleware.error('Failed to fetch depots', { error: error.message });
      throw error;
    }
  }

  static async fetchVehicles() {
    try {
      LoggingMiddleware.info('Fetching vehicles from API');
      const response = await axios.get(`${API_BASE_URL}/evaluation-service/vehicles`, {
        headers: API_HEADERS
      });
      LoggingMiddleware.info('Vehicles fetched successfully', { count: response.data.vehicles.length });
      return response.data.vehicles;
    } catch (error) {
      LoggingMiddleware.error('Failed to fetch vehicles', { error: error.message });
      throw error;
    }
  }

  static solveKnapsack(vehicles, capacity) {
    LoggingMiddleware.debug('Solving knapsack problem', { 
      vehicleCount: vehicles.length, 
      capacity: capacity 
    });

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

    const result = {
      maxImpact: dp[capacity],
      selectedVehicles: Object.values(selected),
      totalDuration: capacity - remainingCapacity,
      availableHours: capacity,
      usedHours: capacity - remainingCapacity,
      remainingHours: remainingCapacity
    };

    LoggingMiddleware.info('Knapsack solution found', {
      maxImpact: result.maxImpact,
      vehiclesSelected: result.selectedVehicles.length,
      totalDuration: result.totalDuration
    });

    return result;
  }

  static scheduleVehiclesForAllDepots(vehicles) {
    LoggingMiddleware.info('Starting vehicle scheduling for all depots');
    return new Promise(async (resolve, reject) => {
      try {
        const depots = await this.fetchDepots();
        const schedules = [];

        for (const depot of depots) {
          LoggingMiddleware.info('Processing depot', { depotId: depot.ID, mechanicHours: depot.MechanicHours });
          
          const solution = this.solveKnapsack(vehicles, depot.MechanicHours);
          schedules.push({
            depot: depot,
            schedule: solution
          });
        }

        LoggingMiddleware.info('Vehicle scheduling completed for all depots');
        resolve(schedules);
      } catch (error) {
        LoggingMiddleware.error('Error in scheduleVehiclesForAllDepots', { error: error.message });
        reject(error);
      }
    });
  }
}

module.exports = VehicleSchedulingService;
