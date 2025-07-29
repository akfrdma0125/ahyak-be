const DailyStatus = require("../models/dailyStatus");

// 일일 기록 조회
const getDailyStatus = async (userId, date) => {
    const dailyStatus = await DailyStatus.findOne({ userId, date });
    return dailyStatus;
};

// discomforts 만 추가
const addDiscomforts = async (userId, date, discomforts) => {
    const discomfortsJson = JSON.parse(discomforts);

    const dailyStatus = await DailyStatus.findOneAndUpdate(
        { userId, date }, // userId와 date가 일치하는 문서를 찾아서
        { $push: { discomforts: { $each: discomfortsJson } } }, // discomforts 배열에 새 증상들 추가
        // upsert: true 옵션을 주면, 데이터가 없을 때 새로 만들어줌
        // new: true 옵션을 주면, 바뀐 결과를 리턴해줌
        { new: true, upsert: true }
    );
    return dailyStatus;
};

// additionalInfo 만 추가
const addAdditionalInfo = async (userId, date, additionalInfo) => {
    const dailyStatus = await DailyStatus.findOneAndUpdate(
        { userId, date },
        { $set: { additionalInfo } },
        { new: true, upsert: true }
    );
    return dailyStatus;
};

// 일일 기록 삭제
const deleteDailyStatus = async (userId, date) => {
    const dailyStatus = await DailyStatus.findOneAndDelete({ userId, date });
    return dailyStatus;
};
 
