const express = require("express");
const router = express.Router();
const { getMedicinesByFilter, createMedicine } = require("../infra/model/medicine");

router.get("/", async (req, res) => {
    try {
        // 🔍 쿼리 실행
        const medicines = await getMedicinesByFilter(req.query);
        res.json({medicine: medicines});
    } catch (err) {
        console.error("약 검색 오류:", err);
        res.status(500).json({ message: "서버 오류" });
    }
});

// 자유 약 등록
router.post("/", async (req, res) => {
    try {
        const { name, print, shape, color, type, line} = req.body;

        if (!name) {
            res.status(400).json({ message: "Bad Request" });
            return;
        }

        // 자유 약 등록 시 기본값 설정
        const seq = "0"; // 기본값으로 설정
        const tokenized = ""; // 기본값으로 설정

        const newMedicine = await createMedicine({
            seq,
            name, // 약 이름
            print, // 식별 문자
            shape, // 약 모양
            color, // 약 색상
            type, // 약 제형
            line, // 분할선
            tokenized
        });

        res.json({ status: "success", data: newMedicine });
    } catch (err) {
        console.error("약 생성 오류:", err);
        res.status(500).json({ message: "서버 오류" });
    }
});

module.exports = router;
