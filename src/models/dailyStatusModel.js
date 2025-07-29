const createModel = require('../utils/createModels');

const dailyStatusFields = {
    user_id: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    date: { type: Date, required: true },
    discomforts: [
        {
            description: String,
            severity: { type: Number, min: 1, max: 5 },
        }
    ],
    additional_info: String
}

module.exports = createModel('DailyStatus', dailyStatusFields);