const mongoose = require('mongoose');
const { Schema, model } = mongoose;

const {findPrescriptionById, findByIdAndUpdate} = require('./prescription');
const {Medicine} = require('./medicine');


const UserMedicineSchema = new Schema({
    user_id: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    medicine_id: { type: Schema.Types.ObjectId, ref: 'Medicine', required: true },
    prescription_id: { type: Schema.Types.ObjectId, ref: 'Prescription', required: true },

    medicine_name: String,
    dose: String,
    unit: String,

    // frequency 관련 필드들
    frequency_type: { 
        type: String, 
        enum: ['interval', 'weekdays', 'custom'], 
        required: true 
    },
    frequency_interval: { type: Number, default: null }, // interval 타입일 때: 1=매일, 2=이틀마다, 3=3일마다
    frequency_weekdays: [{ type: Number }], // weekdays 타입일 때: [1,3,5] = 월,수,금
    frequency_custom: { type: String, default: null }, // custom 타입일 때: 사용자 정의 문자열
    
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

const createMedicineWithLogs = async (userMedicineData, endDate) => {
    const { user_id, medicine_id, prescription_id, medicine_name, dose, unit, frequency_type, frequency_interval, frequency_weekdays, frequency_custom, times, start_date } = userMedicineData;

    // 1. UserMedicine 저장
    const newUserMedicine = new UserMedicine(userMedicineData);

    console.log("UserMedicine Data:", userMedicineData);

    await newUserMedicine.save();

    // custom 타입이거나 복용 기록이 필요없는 경우
    if (frequency_type === 'custom') return newUserMedicine;

    // 2. start_date부터 endDate까지 frequency_type에 따라 복용 기록 생성
    let logs = [];
    let current = new Date(start_date);
    const end = new Date(endDate);
    const timesArray = newUserMedicine.times; // ["아침", "점심", "저녁"] 형태로 가정

    while (current <= end) {
        let shouldCreateLogs = false;

        // frequency_type에 따른 날짜 체크
        switch (frequency_type) {
            case 'interval':
                // interval 타입: 매일, 이틀마다 등
                shouldCreateLogs = true;
                break;
            
            case 'weekdays':
                // weekdays 타입: 특정 요일만
                const dayOfWeek = current.getDay(); // 0=일요일, 1=월요일, ..., 6=토요일
                shouldCreateLogs = frequency_weekdays.includes(dayOfWeek);
                break;
        }

        if (shouldCreateLogs) {
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
        }

        // 다음 날짜로 이동
        if (frequency_type === 'interval') {
            // interval 타입: frequency_interval만큼 증가
            current = new Date(current.getTime() + frequency_interval * 86400000);
        } else {
            // weekdays 타입: 하루씩 증가
            current.setDate(current.getDate() + 1);
        }
        
        console.log("Current Date:", current);
    }

    if (logs.length > 0) {
        await UserMedicineLog.insertMany(logs);
    }
    
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
                   medicines: {} // 약 정보를 그룹화할 객체 추가
               };
           }

           const medicineKey = log.userMedicine_id.toString();
           if (!grouped[key].medicines[medicineKey]) {
               grouped[key].medicines[medicineKey] = {
                   medicineName: log.medicine_name || log.medicine_id?.name,
                   dose: log.dose,
                   unit: log.unit,
                   logs: []
               };
           }
           grouped[key].medicines[medicineKey].logs.push({
               id : log._id,
               time: log.time,
               taken: log.taken
           });
       }
    return Object.values(grouped);
}



// soft delete: prescription_id가 삭제되면 userMedicine도 삭제
const deletePrescription = async (prescription_id) => {
    try {
        // 1. 처방 비활성화
        await findByIdAndUpdate(prescription_id, {
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

const updateTakenStatus = async (userId, logId, taken) => {
    try{
        // userId로 해당 userMedicineId를 보유하고 있는지 찾는다.
        const medicineLog = await UserMedicineLog.findOne({ user_id: userId, _id: logId });
        if (!medicineLog) {
            throw new Error("해당 기록이 존재하지 않습니다.");
        }

        // 복용 여부 업데이트
        await UserMedicineLog.findByIdAndUpdate(
            logId,
            { taken: taken }
        );
    } catch (err) {
        console.log("복용 상태 업데이트 오류:", err);
        throw new Error("복용 상태 업데이트에 실패했습니다.");
    }
}

const getMonthlyMedicineStats = async (userId, month, year) => {
    try {
        // 1) 월(month)을 Date 생성자에 넣을 땐 0-based로 바꿔준다
        const startDate = new Date(year, month - 1, 1, 0, 0 , 0, 0);

        // 2) 마지막 날은 day=0 트릭을 그대로 쓰되, month만 1 늘려서
        const endDate = new Date(year, month, 0, 23, 59, 59, 999);

        console.log(startDate); // → Fri Feb 01 2025 00:00:00
        console.log(endDate);   // → Fri Feb 28 2025 23:59:59.999

        // 2. Fetch logs for the given month
        const logs = await UserMedicineLog.find({
            user_id: userId,
            take_date: { $gte: startDate, $lte: endDate },
        }).populate('medicine_id').lean();

        // 3. Group logs by date and medicine
        const groupedData = {};
        for (const log of logs) {
            const dateKey = log.take_date.toISOString().split('T')[0]; // Format date as YYYY-MM-DD
            if (!groupedData[dateKey]) {
                groupedData[dateKey] = {};
            }

            const medicineKey = log.medicine_id._id.toString();
            if (!groupedData[dateKey][medicineKey]) {
                groupedData[dateKey][medicineKey] = {
                    medicineId: log.medicine_id._id,
                    medicineName: log.medicine_id.name,
                    totalLogs: 0,
                    takenLogs: 0
                };
            }

            groupedData[dateKey][medicineKey].totalLogs++;
            if (log.taken) {
                groupedData[dateKey][medicineKey].takenLogs++;
            }
        }

        // 4. Calculate achievement rates and structure the response
        const result = [];
        for (const [date, medicines] of Object.entries(groupedData)) {
            const dailyDetails = {
                date,
                achieved: true,
                medicines: []
            };

            for (const [medicineId, data] of Object.entries(medicines)) {
                const percentage = (data.takenLogs / data.totalLogs) * 100;
                dailyDetails.medicines.push({
                    medicineId: data.medicineId,
                    medicineName: data.medicineName,
                    percentage: percentage.toFixed(2) // Round to 2 decimal places
                });

                if (percentage < 100) {
                    dailyDetails.achieved = false; // Mark as not fully achieved if any medicine is below 100%
                }
            }

            result.push(dailyDetails);
        }

        // 5. Calculate overall monthly achievement rate
        const totalLogs = logs.length;
        const takenLogs = logs.filter(log => log.taken).length;
        const achievementRate = totalLogs > 0 ? (takenLogs / totalLogs) * 100 : 0;

        return {
            achievementRate: achievementRate.toFixed(2), // Overall monthly achievement rate
            details: result // Daily details
        };
    } catch (err) {
        console.error("Error fetching monthly medicine stats:", err);
        throw new Error("Failed to fetch monthly medicine stats.");
    }
};

async function updateUserMedicine(userMedicineId, updatedData, actionType, prescription) {


    // 1. 기존 복용 기록
    const oldLogs = await UserMedicineLog.find({
        userMedicine_id: userMedicineId
    });

    // 2. 삭제 전략에 따른 처리
    switch (actionType) {
        case 0:
            // 모든 기록 삭제
            await UserMedicineLog.deleteMany({ userMedicine_id: userMedicineId });
            break;

        case 1:
            // 미복용 기록만 삭제
            await UserMedicineLog.deleteMany({
                userMedicine_id: userMedicineId,
                taken: false
            });
            break;

        case 2:
            // 유지, 중복되지 않는 부분만 생성
            // → 밑에서 새 로그 만들 때 고려
            break;
    }

    // 3. UserMedicine 수정
    const updatedMedicine = await UserMedicine.findByIdAndUpdate(
        userMedicineId,
        updatedData,
        { new: true }
    );

    const endDate = prescription.end_date;
    const startDate = updatedMedicine.start_date;
    const frequency_type = updatedMedicine.frequency_type;
    const frequency_interval = updatedMedicine.frequency_interval;
    const frequency_weekdays = updatedMedicine.frequency_weekdays;
    const times = updatedMedicine.times;

    if (frequency_type === 'custom') return updatedMedicine;

    const newLogs = [];

    let date = new Date(startDate);

    while (date <= endDate) {
        let shouldCreateLogs = false;

        // frequency_type에 따른 날짜 체크
        switch (frequency_type) {
            case 'interval':
                // interval 타입: 매일, 이틀마다 등
                shouldCreateLogs = true;
                break;
            
            case 'weekdays':
                // weekdays 타입: 특정 요일만
                const dayOfWeek = date.getDay(); // 0=일요일, 1=월요일, ..., 6=토요일
                shouldCreateLogs = frequency_weekdays.includes(dayOfWeek);
                break;
        }

        if (shouldCreateLogs) {
            for (const time of times) {
                // 기존 기록 유지 옵션이면 중복 제외
                const exists = await UserMedicineLog.findOne({
                    userMedicine_id: userMedicineId,
                    take_date: date,
                    time,
                });

                if (actionType === 'keep_existing' && exists) continue;

                newLogs.push({
                    user_id: updatedMedicine.user_id,
                    medicine_id: updatedMedicine.medicine_id,
                    prescription_id: updatedMedicine.prescription_id,
                    userMedicine_id: updatedMedicine._id,
                    medicine_name: updatedMedicine.medicine_name,
                    dose: updatedMedicine.dose,
                    unit: updatedMedicine.unit,
                    take_date: new Date(date),
                    time,
                    taken: false,
                });
            }
        }

        // 다음 날짜로 이동
        if (frequency_type === 'interval') {
            // interval 타입: frequency_interval만큼 증가
            date.setDate(date.getDate() + frequency_interval);
        } else {
            // weekdays 타입: 하루씩 증가
            date.setDate(date.getDate() + 1);
        }
    }

    if (newLogs.length > 0) {
        await UserMedicineLog.insertMany(newLogs);
    }

    return updatedMedicine;
}


module.exports = {UserMedicineLog, createMedicineWithLogs, getUserMedicineByDate,
    deletePrescription, deleteUserMedicine, updateTakenStatus, getMonthlyMedicineStats, UserMedicine, updateUserMedicine};

