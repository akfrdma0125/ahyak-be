const express = require("express");
const router = express.Router();
const { createPrescription } = require("../infra/model/prescription");
const { createMedicineWithLogs, getUserMedicineByDate } = require("../infra/model/medication");

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

router.post("/medicine", async (req, res) => {
    try {
        const user_id = req.user_id;
        // req.body 에서 필요한 데이터 추출
        const { medicine_id, prescription_id, medicine_name, dose, unit, frequency, times, start_date } = req.body;

        // 만약 데이터가 하나라도 없는 경우 400 에러를 반환합니다.
        if (!user_id || !medicine_id || !prescription_id || !medicine_name || !dose || !unit || !frequency || !times || !start_date) {
            res.status(400).json({ message: "Bad Request" });
            return;
        }

        const medicine = await createMedicineWithLogs({
            user_id,
            medicine_id,
            prescription_id,
            medicine_name,
            dose,
            unit,
            frequency,
            times,
            start_date
        });
        // res.json({ medicine });
        return res.status(200).json({ message: "약 생성 성공" });
    } catch (err) {
        console.error("약 생성 오류:", err);
        res.status(500).json({ message: "서버 오류" });
    }
});

router.get("/medicine", async (req, res) => {
    try {
        const user_id = req.user_id;
        const date = req.query.date;

        // 만약 데이터가 하나라도 없는 경우 400 에러를 반환합니다.
        if (!user_id || !date) {
            res.status(400).json({ message: "Bad Request" });
            return;
        }

        const medicines = await getUserMedicineByDate(user_id, date);
        res.json({ medicines });
    } catch (err) {
        console.error("약 검색 오류:", err);
        res.status(500).json({ message: "서버 오류" });
    }
});

module.exports = router;
