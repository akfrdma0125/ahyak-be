const dailyStatusService = require("../services/dailyStatusService");

const createDailyStatus = async (req, res) => {
    const { date, discomforts, additionalInfo } = req.body;
    const userId = req.user_id;

    const newStatus = await dailyStatusService.createDailyStatus(userId, date, discomforts, additionalInfo);
    res.json({ status: "success", data: newStatus });
};

module.exports = { createDailyStatus };