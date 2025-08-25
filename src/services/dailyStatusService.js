const DailyStatus = require("../models/dailyStatus");

/**
 * 일일 기록 조회
 * @param {string} userId - 사용자 ID
 * @param {Date} date - 조회할 날짜
 * @returns {Object|null} 일일 상태 정보
 */
const getDailyStatus = async (userId, date) => {
    try {
        const dailyStatus = await DailyStatus.findOne({ 
            user_id: userId, 
            date: {
                $gte: new Date(date.getFullYear(), date.getMonth(), date.getDate()),
                $lt: new Date(date.getFullYear(), date.getMonth(), date.getDate() + 1)
            }
        });
        return dailyStatus;
    } catch (error) {
        console.error("getDailyStatus service error:", error);
        throw error;
    }
};

/**
 * 일일 상태 생성
 * @param {string} userId - 사용자 ID
 * @param {Date} date - 날짜
 * @param {Array} discomforts - 불편함 증상 배열
 * @param {string} additionalInfo - 추가 정보
 * @returns {Object} 생성된 일일 상태
 */
const createDailyStatus = async (userId, date, discomforts = [], additionalInfo = null) => {
    try {
        // 기존 데이터가 있는지 확인
        const existingStatus = await getDailyStatus(userId, date);
        if (existingStatus) {
            throw new Error("Daily status already exists for this date");
        }

        const newStatus = new DailyStatus({
            user_id: userId,
            date: date,
            discomforts: discomforts || [],
            additional_info: additionalInfo
        });

        await newStatus.save();
        return newStatus;
    } catch (error) {
        console.error("createDailyStatus service error:", error);
        throw error;
    }
};

/**
 * 불편함 증상 추가
 * @param {string} userId - 사용자 ID
 * @param {Date} date - 날짜
 * @param {Array} discomforts - 추가할 불편함 증상 배열
 * @returns {Object} 업데이트된 일일 상태
 */
const addDiscomforts = async (userId, date, discomforts) => {
    try {
        const dailyStatus = await DailyStatus.findOneAndUpdate(
            { 
                user_id: userId, 
                date: {
                    $gte: new Date(date.getFullYear(), date.getMonth(), date.getDate()),
                    $lt: new Date(date.getFullYear(), date.getMonth(), date.getDate() + 1)
                }
            },
            { $push: { discomforts: { $each: discomforts } } },
            { new: true, upsert: true }
        );
        return dailyStatus;
    } catch (error) {
        console.error("addDiscomforts service error:", error);
        throw error;
    }
};

/**
 * 추가 정보 업데이트
 * @param {string} userId - 사용자 ID
 * @param {Date} date - 날짜
 * @param {string} additionalInfo - 추가 정보
 * @returns {Object} 업데이트된 일일 상태
 */
const addAdditionalInfo = async (userId, date, additionalInfo) => {
    try {
        const dailyStatus = await DailyStatus.findOneAndUpdate(
            { 
                user_id: userId, 
                date: {
                    $gte: new Date(date.getFullYear(), date.getMonth(), date.getDate()),
                    $lt: new Date(date.getFullYear(), date.getMonth(), date.getDate() + 1)
                }
            },
            { $set: { additional_info: additionalInfo } },
            { new: true, upsert: true }
        );
        return dailyStatus;
    } catch (error) {
        console.error("addAdditionalInfo service error:", error);
        throw error;
    }
};

/**
 * 일일 기록 삭제
 * @param {string} userId - 사용자 ID
 * @param {Date} date - 삭제할 날짜
 * @returns {Object|null} 삭제된 일일 상태
 */
const deleteDailyStatus = async (userId, date) => {
    try {
        const dailyStatus = await DailyStatus.findOneAndDelete({ 
            user_id: userId, 
            date: {
                $gte: new Date(date.getFullYear(), date.getMonth(), date.getDate()),
                $lt: new Date(date.getFullYear(), date.getMonth(), date.getDate() + 1)
            }
        });
        return dailyStatus;
    } catch (error) {
        console.error("deleteDailyStatus service error:", error);
        throw error;
    }
};

/**
 * 특정 기간의 일일 상태 조회
 * @param {string} userId - 사용자 ID
 * @param {Date} startDate - 시작 날짜
 * @param {Date} endDate - 종료 날짜
 * @returns {Array} 일일 상태 배열
 */
const getDailyStatusByDateRange = async (userId, startDate, endDate) => {
    try {
        const dailyStatuses = await DailyStatus.find({
            user_id: userId,
            date: {
                $gte: new Date(startDate.getFullYear(), startDate.getMonth(), startDate.getDate()),
                $lte: new Date(endDate.getFullYear(), endDate.getMonth(), endDate.getDate() + 1)
            }
        }).sort({ date: 1 });
        
        return dailyStatuses;
    } catch (error) {
        console.error("getDailyStatusByDateRange service error:", error);
        throw error;
    }
};

module.exports = {
    getDailyStatus,
    createDailyStatus,
    addDiscomforts,
    addAdditionalInfo,
    deleteDailyStatus,
    getDailyStatusByDateRange
};
 
