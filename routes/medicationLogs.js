const express = require("express");
const router = express.Router();
const {updateTakenStatus, getMonthlyMedicineStats} = require("../infra/model/medication");
const {getMedicationStats, getDailyStats} = require("../infra/model/prescription");
router.patch("/", async (req, res) => {
    try {
        // user 정보 가져오기
        const userId = req.user_id;
        // req.body에서 ID와 복용 여부 가져오기
        await updateTakenStatus(userId, req.body.logId, req.body.taken).then(() => {
            return res.status(200).json({ message: "복용 상태 업데이트 성공" });
        });
    } catch (err) {
        return res.status(400).json({message: err.message});
    }
});

router.get("/stats", async (req, res) => {
    try {
        const userId = req.user_id;
        const stats = await getDailyStats(userId, req.query.date);
        return res.status(200).json({ message: "복용 통계 조회 성공", data: stats });
    } catch (err) {
        return res.status(400).json({ message: err.message });
    }
});

router.get("/monthly", async (req, res) => {
    try {
        const userId = req.user_id;
        const month = req.query.month;
        const year = req.query.year;

        // 월별 통계 조회
        const monthlyStats = await getMonthlyMedicineStats(userId, month, year);
        return res.status(200).json({ message: "월별 통계 조회 성공", data: monthlyStats });
    } catch (err) {
        return res.status(400).json({ message: err.message });
    }
});

module.exports = router;
