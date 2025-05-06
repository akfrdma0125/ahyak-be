const mongoose = require('mongoose');

const { Schema, model } = mongoose;
const { UserMedicineLog } = require('./medication');

const PrescriptionSchema = new Schema({
    user_id: { type: Schema.Types.ObjectId, ref: 'User', required: true }, // 사용자 ID
    name: { type: String, required: true }, // 처방 이름
    hospital: { type: String, required: true }, // 병원 이름
    start_date: { type: Date, required: true }, // 시작일
    end_date: { type: Date, required: true }, // 종료일
    is_Active: { type: Boolean, default: true } // Soft Delete
});

const Prescription = model("Prescription", PrescriptionSchema);
module.exports = Prescription;


// create
const createPrescription = async (userId, name, hospital, startDate, endDate) => {
    try {
        const newPrescription = new Prescription({
            user_id: userId,
            name,
            hospital,
            start_date: new Date(startDate),
            end_date: new Date(endDate)
        });

        await newPrescription.save();
        return newPrescription;
    } catch (err) {
        console.error("처방 저장 실패:", err);
        throw err;
    }
};

const getPrescription = async(userId, prescriptionId) => {
    try {
        return await Prescription.findOne({ user_id: userId, _id: prescriptionId });
    } catch (err) {
        console.error("처방 조회 실패:", err);
        throw err;
    }
}


const getDailyStats = async (userId, date) => {
    try {
        const startDate = new Date(date);
        const endDate = new Date(date);
        endDate.setDate(endDate.getDate() + 1);

        const prescriptions = await Prescription.find({
            user_id: userId,
            // date 가 start_date와 end_date 사이에 있는지 확인
            start_date: { $lte: endDate },
            end_date: { $gte: startDate },
        });

        // 받은 prescriptionId로 UserMedicineLog에서 복용 여부 체크
        const logs = await UserMedicineLog.find({
            user_id: userId,
            prescription_id: { $in: prescriptions.map(p => p._id) },
            take_date: date
        });
        console.log("복용 기록:", logs);

        const prescriptionStats = prescriptions.map(prescription => {
            const relatedLogs = logs.filter(log => log.prescription_id.toString() === prescription._id.toString());
            const takenCount = relatedLogs.filter(log => log.taken).length;
            const totalCount = relatedLogs.length;
            const takenRatio = totalCount > 0 ? (takenCount / totalCount) * 100 : 0;

            return {
                prescriptionId: prescription._id,
                name: prescription.name,
                takenRatio: takenRatio.toFixed(2), // 복용 비율 (소수점 2자리)
                takenCount,
                totalCount
            };
        });

        console.log("복용 비율 통계:", prescriptionStats);


        return prescriptionStats;
    }catch (err) {
        console.error("처방전 통계 조회 실패:", err);
    }
}


module.exports = { createPrescription, Prescription, getPrescription, getDailyStats };