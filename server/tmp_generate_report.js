const reportService = require('./src/services/reportService');

(async () => {
  try {
    const now = new Date();
    const month = now.getMonth() + 1;
    const year = now.getFullYear();
    // Use an existing user id from the local DB for testing
    const userId = 'cmrvlvdgg0002i622r855o0j7';
    console.log('Generating report for', month, year, 'userId', userId);
    const result = await reportService.generateReport({ month, year, userId, sendTelegram: false });
    console.log('Report generated:', result);
  } catch (err) {
    console.error('Error generating report:', err);
    process.exitCode = 1;
  }
})();
