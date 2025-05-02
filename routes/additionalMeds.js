const express = require("express");
const router = express.Router();
const { createAdditionalMed, getMedsByDate } = require("../infra/model/additionalMeds");

// Route to create a new additional medicine
router.post("/", async (req, res) => {
    let userId = req.user_id; // JWT 토큰에서 사용자 ID 추출

    const { name, dose, unit, date } = req.body;

    try {
        const newMed = await createAdditionalMed(userId, name, dose, unit, date);
        res.status(201).json({ success: true, data: newMed });
    } catch (err) {
        console.error("Failed to create additional medicine:", err);
        res.status(500).json({ success: false, message: "Failed to create additional medicine" });
    }
});

// Route to get additional medicines by date
router.get("/", async (req, res) => {
    let userId = req.user_id; // JWT 토큰에서 사용자 ID 추출

    const { date } = req.query;
    try {
        const meds = await getMedsByDate(userId, date);
        res.status(200).json({ success: true, data: meds });
    } catch (err) {
        console.error("Failed to retrieve additional medicines:", err);
        res.status(500).json({ success: false, message: "Failed to retrieve additional medicines" });
    }
});

module.exports = router;