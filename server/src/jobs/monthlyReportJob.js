const cron = require('node-cron');
const reportService = require('../services/reportService');

const initMonthlyReportJob = () => {
  cron.schedule('0 8 1 * *', async () => {
    console.log('[Scheduler] Running monthly financial report job...');
    try {
      const now = new Date();
      const year = now.getFullYear();
      const month = now.getMonth();
      const reportMonth = month === 0 ? 12 : month;
      const reportYear = month === 0 ? year - 1 : year;

      await reportService.generateReport({
        month: reportMonth,
        year: reportYear,
        userId: process.env.SYSTEM_USER_ID || 'system',
        sendTelegram: true,
      });

      console.log(`[Scheduler] Monthly report generated for ${reportYear}-${String(reportMonth).padStart(2, '0')}`);
    } catch (err) {
      console.error('[Scheduler] Monthly report job failed:', err);
    }
  });
};

module.exports = {
  initMonthlyReportJob,
};