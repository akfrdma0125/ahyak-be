const express = require("express");
const router = express.Router();
const {updateTakenStatus} = require("../infra/model/medication");
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

module.exports = router;
