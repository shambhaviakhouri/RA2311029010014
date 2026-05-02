require('dotenv').config();

const VehicleSchedulingService = require('./VehicleSchedulingService');
const LoggingMiddleware = require('../LoggingMiddleware');

async function main() {
  try {
    LoggingMiddleware.info('Vehicle Maintenance Scheduler started');
    
    const vehicles = await VehicleSchedulingService.fetchVehicles();
    const schedules = await VehicleSchedulingService.scheduleVehiclesForAllDepots(vehicles);

    console.log('\n========== VEHICLE MAINTENANCE SCHEDULING RESULTS ==========\n');

    schedules.forEach(item => {
      const { depot, schedule } = item;
      console.log(`\nDepot ID: ${depot.ID}`);
      console.log(`Mechanic Hours Available: ${depot.MechanicHours}`);
      console.log(`-------------------------------------------`);
      console.log(`Maximum Impact Score Achievable: ${schedule.maxImpact}`);
      console.log(`Total Hours Used: ${schedule.usedHours}/${schedule.availableHours}`);
      console.log(`Remaining Hours: ${schedule.remainingHours}`);
      console.log(`Number of Vehicles to Service: ${schedule.selectedVehicles.length}`);
      console.log(`\nVehicles to Service:`);
      
      schedule.selectedVehicles.forEach((vehicle, index) => {
        console.log(`  ${index + 1}. Task ID: ${vehicle.TaskID}`);
        console.log(`     Duration: ${vehicle.Duration} hours, Impact: ${vehicle.Impact}`);
      });
      
      console.log('\n');
    });

    LoggingMiddleware.info('Vehicle Maintenance Scheduler completed successfully');
  } catch (error) {
    LoggingMiddleware.error('Application error', { error: error.message });
    console.error('Error:', error.message);
    process.exit(1);
  }
}

main();
