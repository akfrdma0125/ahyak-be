const mongoose = require('mongoose');
const { Schema, model } = mongoose;

const {Prescription} = require('./prescription');
const {Medicine} = require('./medicine');


const UserMedicineSchema = new Schema({
    user_id: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    medicine_id: { type: Schema.Types.ObjectId, ref: 'Medicine', required: true },
    prescription_id: { type: Schema.Types.ObjectId, ref: 'Prescription', required: true },

    medicine_name: String,
    dose: String,
    unit: String,

    frequency: Number, // 예: 1 = 매일, 2 = 이틀마다, -1 = 사용자 지정
    times: [String], // 예: ["아침", "점심"]
    start_date: Date,
    isActive: { type: Boolean, default: true }
});

const UserMedicine = model('UserMedicine', UserMedicineSchema);

const UserMedicineLogSchema = new Schema({
    user_id: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    medicine_id: { type: Schema.Types.ObjectId, ref: 'Medicine', required: true },
    prescription_id: { type: Schema.Types.ObjectId, ref: 'Prescription', required: true },
    userMedicine_id: { type: Schema.Types.ObjectId, ref: 'UserMedicine', required: true },

    medicine_name: String,
    dose: String,
    unit: String,
    take_date: Date, // 복용 날짜
    time: String,     // 아침, 점심, 저녁 등
    taken: { type: Boolean, default: false }, // 복용 여부 체크
    isActive: { type: Boolean, default: true }
});

const UserMedicineLog = model('UserMedicineLog', UserMedicineLogSchema);

const createMedicineWithLogs = async (userMedicineData) => {
    const { user_id, medicine_id, prescription_id, medicine_name, dose, unit, frequency, times, start_date } = userMedicineData;

    // 1. UserMedicine 저장
    const newUserMedicine = new UserMedicine(userMedicineData);

    console.log("UserMedicine Data:", userMedicineData);

    await newUserMedicine.save();

    // 2. 증상 테이블에서 end_date 가져오기
    const symptom = await Prescription.findById(prescription_id);
    const endDate = symptom.end_date;

    if (frequency === -1) return newUserMedicine;

    // 3. start_date부터 endDate까지 주기(frequency) 간격으로 복용 기록 생성
    let logs = [];
    let current = new Date(start_date);
    const end = new Date(endDate);
    const timesArray = newUserMedicine.times; // ["아침", "점심", "저녁"] 형태로 가정

    while (current <= end) {
        for (const time of timesArray) {
            console.log("Current Time:", time);
            logs.push({
                user_id,
                medicine_id,
                prescription_id,
                userMedicine_id: newUserMedicine._id,
                medicine_name,
                dose,
                unit,
                take_date: new Date(current), // 복용 날짜
                time
            });
        }
        // 주기(frequency)만큼 날짜를 증가시킴
        current = new Date(current.getTime() + frequency * 86400000);
        console.log("Current Date:", current);
    }

    await UserMedicineLog.insertMany(logs);
    return newUserMedicine; // 저장된 UserMedicine 반환
};

const getUserMedicineByDate = async (user_id, date) => {

    const targetDate = new Date(date);

    // 1. 복용 로그 조회
    const logs = await UserMedicineLog.find({
        user_id: user_id,
        take_date: targetDate,
        isActive: true
    })
        .populate('prescription_id') // 처방 이름 및 날짜
        .populate('medicine_id')      // 약 이름 등
        .lean();

    // 2. 처방별로 그룹핑
    const grouped = {};

    for (const log of logs) {
        const prescription = log.prescription_id;
        if (!prescription) continue;

        const key = prescription._id.toString();
        if (!grouped[key]) {
            grouped[key] = {
                prescriptionId: prescription._id,
                symptomName: prescription.name, // 증상 이름
                startDate: prescription.start_date,
                logs: []
            };
        }

        grouped[key].logs.push({
            medicineName: log.medicine_name || log.medicine_id?.name,
            dose: log.dose,
            unit: log.unit,
            time: log.time,
            taken: log.taken
        });
    }

    return Object.values(grouped); // 배열 형태로 리턴
}

// soft delete: prescription_id가 삭제되면 userMedicine도 삭제
const deletePrescription = async (prescription_id) => {
    try {
        // 1. 처방 비활성화
        await Prescription.findByIdAndUpdate(prescription_id, {
            is_Active: false
        });

        // 2. 연결된 UserMedicine 비활성화
        await UserMedicine.updateMany(
            { prescription_id: prescription_id },
            { isActive: false }
        );

        // 3. 연결된 복용 기록(UserMedicineTakeLog)도 비활성화
        await UserMedicineLog.updateMany(
            { prescription_id: prescription_id },
            { isActive: false }
        );
    } catch (err) {
        console.error('UserMedicine 삭제 실패:', err);
    }
};

const deleteUserMedicine = async (userMedicineId) => {
    try {
        // 1. UserMedicine 비활성화
        await UserMedicine.findByIdAndUpdate(userMedicineId, {
            isActive: false
        });

        // 2. 연결된 복용 기록(UserMedicineTakeLog)도 비활성화
        await UserMedicineLog.updateMany(
            { userMedicine_id: userMedicineId },
            { isActive: false }
        );
    } catch (err) {
        console.error('UserMedicine 삭제 실패:', err);
    }
}

module.exports = {createMedicineWithLogs, getUserMedicineByDate, deletePrescription, deleteUserMedicine};

