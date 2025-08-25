const express = require("express");
const router = express.Router();
const { createPrescription, getPrescription, updatePrescription, findPrescriptionById } = require("../infra/model/prescription");
const { createMedicineWithLogs, getUserMedicineByDate, deletePrescription, deleteUserMedicine } = require("../infra/model/medication");

router.post("/", async (req, res) => {
    try {
        const userId = req.user_id;
        const { name, hospital, startDate, endDate } = req.body;

        // 만약 데이터가 하나라도 없는 경우 400 에러를 반환합니다.
        if (!name || !hospital || !startDate || !endDate) {
            res.status(400).json({ message: "Bad Request" });
            return;
        }

        // 유효성 로직: 시작일은 종료일보다 같거나 이전이어야 합니다.
        const start = new Date(startDate);
        const end = new Date(endDate);
        if (start > end) {
            return res.status(400).json({ message: "시작일은 종료일보다 이전이어야 합니다." });
        }

        const prescription = await createPrescription(userId, name, hospital, startDate, endDate);
        res.json({ prescription });
    } catch (err) {
        console.error("처방 생성 오류:", err);
        res.status(500).json({ message: "서버 오류" });
    }
});

// 처방 기록 조회
router.get("/", async (req, res) => {
    try {
        const userId = req.user_id;
        const prescriptionId = req.query.prescription_id;

        if (!prescriptionId) {
            return res.status(400).json({ message: "처방전 ID가 필요합니다." });
        }

        const prescription = await getPrescription(userId, prescriptionId);
        if (!prescription) {
            return res.status(404).json({ message: "처방전이 존재하지 않습니다." });
        }

        res.json({ prescription });
    } catch (err) {
        console.error("처방전 조회 오류:", err);
        res.status(500).json({ message: "서버 오류" });
    }
});

// 처방 기록 수정
// requestBody: { prescription_id, name, hospital, start_date, end_date }
router.patch("/", async (req, res) => {
    try {
        const userId = req.user_id;

        const { prescription_id, name, hospital, start_date, end_date } = req.body;
        if (!prescription_id || !name || !hospital || !start_date || !end_date) {
            return res.status(400).json({ message: "처방전 ID와 수정할 데이터를 모두 제공해야 합니다." });
        }

        // 시작일/종료일이 변경되었는지 확인
        const prePrescription = await getPrescription(userId, prescription_id);
        if (!prePrescription) {
            return res.status(404).json({ message: "처방전이 존재하지 않습니다." });
        }

        const start = new Date(start_date);
        const end = new Date(end_date);

        await updatePrescription(userId, prescription_id, {
            name,
            hospital,
            start_date: start,
            end_date: end
        });
        // 처방전 수정 로직을 여기에 추가합니다.
        // 예를 들어, 처방전의 이름이나 병원 이름을 수정할 수 있습니다.

        res.json({ message: "처방전이 수정되었습니다." });
    } catch (err) {
        console.error("처방전 수정 오류:", err);
        res.status(500).json({ message: "서버 오류" });
    }
});

router.post("/medicine", async (req, res) => {
    try {
        const user_id = req.user_id;
        // req.body 에서 필요한 데이터 추출
        const { medicine_id, prescription_id, medicine_name, dose, unit, frequency_type, frequency_interval, frequency_weekdays, frequency_custom, times, start_date } = req.body;

        // 만약 데이터가 하나라도 없는 경우 400 에러를 반환합니다.
        if (!user_id || !medicine_id || !prescription_id || !medicine_name || !dose || !unit || !frequency_type || !times || !start_date) {
            res.status(400).json({ message: "Bad Request" });
            return;
        }

        // frequency_type 별 추가 유효성 검사 (필요 시)
        if (frequency_type === 'interval' && (typeof frequency_interval !== 'number' || frequency_interval <= 0)) {
            return res.status(400).json({ message: "interval 타입은 유효한 frequency_interval(양수)이 필요합니다." });
        }
        if (frequency_type === 'weekdays' && (!Array.isArray(frequency_weekdays) || frequency_weekdays.length === 0)) {
            return res.status(400).json({ message: "weekdays 타입은 frequency_weekdays 배열이 필요합니다." });
        }


        // 2. 증상 테이블에서 end_date 가져오기
        const symptom = await findPrescriptionById(prescription_id);
        const endDate = symptom.end_date;

        const medicine = await createMedicineWithLogs({
            user_id,
            medicine_id,
            prescription_id,
            medicine_name,
            dose,
            unit,
            frequency_type,
            frequency_interval,
            frequency_weekdays,
            frequency_custom,
            times,
            start_date
        }, endDate);
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

router.delete("/", async (req, res) => {
    try {
        const prescriptionId = req.query.prescription_id;
        const userId = req.user_id;

        if (!prescriptionId) {
            return res.status(400).json({ message: "처방전 ID가 필요합니다." });
        }

        await deletePrescription(prescriptionId);

        res.json({ message: "처방전이 삭제되었습니다." });
    } catch (err) {
        console.error("처방전 삭제 오류:", err);
        res.status(500).json({ message: "서버 오류" });
    }
});

router.delete("/medicine", async (req, res) => {
    try {
        const userMedicineId = req.query.userMedicine_id;

        if (!userMedicineId) {
            return res.status(400).json({ message: "UserMedicine ID가 필요합니다." });
        }

        // UserMedicine 삭제 로직을 여기에 추가합니다.
        await deleteUserMedicine(userMedicineId);

        res.json({ message: "UserMedicine이 삭제되었습니다." });
    } catch (err) {
        console.error("UserMedicine 삭제 오류:", err);
        res.status(500).json({ message: "서버 오류" });
    }
});

module.exports = router;
