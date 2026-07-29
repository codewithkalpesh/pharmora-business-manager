const reportService = require('../services/reportService');
const ApiResponse = require('../utils/ApiResponse');

const generateMonthlyReport = async (req, res, next) => {
  try {
    const { month, year, sendTelegram = true } = req.body;
    if (!month || !year) {
      return res.status(400).json(new ApiResponse(400, null, 'month and year are required.'));
    }

    const result = await reportService.generateReport({
      month: Number(month),
      year: Number(year),
      userId: req.user.id,
      sendTelegram: Boolean(sendTelegram),
    });

    const url = `${req.protocol}://${req.get('host')}/uploads/reports/${encodeURIComponent(result.fileName)}`;
    return res.status(200).json(new ApiResponse(200, { reportUrl: url, fileName: result.fileName }, 'Monthly report generated successfully.'));
  } catch (error) {
    next(error);
  }
};

module.exports = {
  generateMonthlyReport,
};