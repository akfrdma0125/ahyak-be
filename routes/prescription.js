const express = require("express");
const router = express.Router();
const { createPrescription } = require("../infra/model/prescription");

router.post("/", async (req, res) => {
    try {
        const userId = req.user_id;
        const { name, hospital, startDate, endDate } = req.body;

        // 만약 데이터가 하나라도 없는 경우 400 에러를 반환합니다.
        if (!name || !hospital || !startDate || !endDate) {
            res.status(400).json({ message: "Bad Request" });
            return;
        }

        const prescription = await createPrescription(userId, name, hospital, startDate, endDate);
        res.json({ prescription });
    } catch (err) {
        console.error("처방 생성 오류:", err);
        res.status(500).json({ message: "서버 오류" });
    }
});

module.exports = router;
