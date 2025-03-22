const express = require("express");
const router = express.Router();
const { createDailyStatus, getDailyStatusByDate} = require("../infra/model/dailyStatus");

router.post("/", async (req, res) => {
    try {
        const { date, discomforts, additionalInfo } = req.body;
        const userId = req.user_id;

        console.log("userId", userId);

        if (!date || !discomforts) {
            res.status(400).json({ message: "Bad Request" });
            return;
        }

        const newStatus = await createDailyStatus(userId, date, discomforts, additionalInfo);
        res.json({ status: "success", data: newStatus });
    } catch (err) {
        console.error("일일 상태 저장 오류:", err);
        res.status(500).json({ message: "서버 오류" });
    }
});

router.get("/", async (req, res) => {
    try {
        const date = req.query.date;
        const userId = req.user_id;

        const status = await getDailyStatusByDate(userId, date);

        if (!status) {
            res.status(404).json({ message: "Not Found" });
            return;
        }

        res.json({ status: "success", data: status });
    } catch (err) {
        console.error("일일 상태 조회 오류:", err);
        res.status(500).json({ message: "서버 오류" });
    }
});

module.exports = router;
