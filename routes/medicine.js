const express = require("express");
const router = express.Router();
const { getMedicinesByFilter } = require("../infra/model/medicine");

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

module.exports = router;
