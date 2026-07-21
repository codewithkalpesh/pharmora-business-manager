const cron = require('node-cron');
const recurringService = require('../services/recurring.service');

function initRecurringJob() {
  // Schedule a task to run daily at midnight (00:00)
  cron.schedule('0 0 * * *', async () => {
    console.log('[Scheduler] Running daily check for recurring transaction schedules...');
    try {
      const { processedCount } = await recurringService.runSchedules();
      console.log(`[Scheduler] Daily check complete. Processed ${processedCount} schedules.`);
    } catch (err) {
      console.error('[Scheduler] Error running recurring schedules job:', err);
    }
  });

  // Run immediately on server boot/start (async catch-up)
  console.log('[Scheduler] Starting on-boot catch-up for recurring transactions...');
  recurringService.runSchedules()
    .then(({ processedCount }) => {
      console.log(`[Scheduler] On-boot catch-up complete. Processed ${processedCount} schedules.`);
    })
    .catch((err) => {
      console.error('[Scheduler] Error during on-boot catch-up:', err);
    });
}

module.exports = {
  initRecurringJob,
};
