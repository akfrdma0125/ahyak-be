const mongoose = require('mongoose');
const { Schema, model } = mongoose;

const AdditionalMedsSchema = new Schema({
    user_id: { type: Schema.Types.ObjectId, ref: 'User', required: true }, // 사용자 ID
    name: { type: String, required: true }, // 약품 이름
    dose: { type: String, required: true }, // 복용량
    unit: { type: String, required: true }, // 단위 (mg, ml 등)
    takenTime: { type: Date, required: true }, // 복용 시간
    is_Active: { type: Boolean, default: true } // Soft Delete
});

const AdditionalMeds = model("AdditionalMeds", AdditionalMedsSchema);

// 추가 약 등록
const createAdditionalMed = async (userId, name, dose, unit, date) => {
    try {
        const newMed = new AdditionalMeds({
            user_id: userId,
            name,
            dose,
            unit,
            takenTime: new Date(date), // `YYYY-MM-DD` 형식의 문자열을 Date로 변환
        });

        await newMed.save();
        return newMed;
    } catch (err) {
        console.error("추가 약 저장 실패:", err);
        throw err;
    }
};

const getMedsByDate = async (userId, date) => {
    console.log(date);

    const startDate = new Date(date);
    console.log("startDate:", startDate);

    const endDate = new Date(date);
    endDate.setDate(endDate.getDate() + 1);
    console.log("endDate:", endDate);

    try {
        // mongo.db aggregate 사용
        const meds = await AdditionalMeds.aggregate([
            {
                $match: {
                    user_id: new mongoose.Types.ObjectId(userId),
                    takenTime: {
                        $gte: startDate,
                        $lt: endDate
                    }
                }
            },
            {
                $project: {
                    _id: 1,
                    name: 1,
                    dose: 1,
                    unit: 1,
                    takenTime: {
                        $dateToString: { format: "%H:%M", date: "$takenTime" }
                    }
                }
            }
        ]);

        return meds;
    } catch (err) {
        console.error("추가 약 조회 실패:", err);
        throw err;
    }
};

module.exports = {getMedsByDate, createAdditionalMed};