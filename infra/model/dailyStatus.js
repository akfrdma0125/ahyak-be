const mongoose = require('mongoose');

const { Schema, model } = mongoose;

const DailyStatusSchema = new Schema({
    user_id: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    date: { type: Date, required: true },
    discomforts: [
        {
            description: String,
            severity: { type: Number, min: 1, max: 5 },
        }
    ],
    additional_info: String
});
const DailyStatus = model('DailyStatus', DailyStatusSchema);
const createDailyStatus = async (userId, date, discomforts, additionalInfo) => {
    try {
        if (typeof discomforts === "string") {
            discomforts = JSON.parse(discomforts);
        }

        const newStatus = new DailyStatus({
            user_id: userId,
            date: new Date(date), // `YYYY-MM-DD` 형식의 문자열을 Date로 변환
            discomforts,
            additional_info: additionalInfo
        });

        await newStatus.save();
        return newStatus;
    } catch (err) {
        console.error("DailyStatus 저장 실패:", err);
        throw err;
    }
};
const getDailyStatusByDate = async (userId, date) => {
    try {
         // 필요하면 User 정보도 함께 조회
        return await DailyStatus.findOne({
            user_id: userId,
            date: new Date(date)
        });
    } catch (err) {
        console.error("DailyStatus 조회 실패:", err);
        throw err;
    }
};

module.exports = { createDailyStatus, getDailyStatusByDate };