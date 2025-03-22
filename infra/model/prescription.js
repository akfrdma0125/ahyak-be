const mongoose = require('mongoose');

const { Schema, model } = mongoose;

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


module.exports = { createPrescription };