const mongoose = require('mongoose');

const { Schema, model } = mongoose;

const MedicineSchema = new Schema({
    seq: String, // ITEM_SEQ
    name: String, // ITEM_NAME
    print: String, // PRINT
    shape: String, // DRUG_SHAPE
    color: String, // COLOR
    type: String, // TYPE
    line: String, // LINE
    tokenized: String // TOKENIZED
});

const Medicine = model('Medicine', MedicineSchema);

const createMedicine = async (medicine) => {
    try {
        const newMedicine = new Medicine(medicine);
        await newMedicine.save();
        return newMedicine;
    } catch (err) {
        console.error('Medicine 생성 실패:', err);
    }
};

const getMedicinesByFilter = async (query) => {
    try {
        // 🔥 동적 필터 생성
        console.log("쿼리:", query);

        /*
            seq: String, // ITEM_SEQ
    name: String, // ITEM_NAME
    print: String, // PRINT
    shape: String, // DRUG_SHAPE
    color: String, // COLOR
    type: String, // TYPE
    line: String, // LINE
    tokenized: String // TOKENIZED
         */

        let filter = {};
        if (query.medicineId) filter.seq = query.medicineId;
        if (query.name) filter.name = query.name;
        if (query.text) filter.print = query.text;
        if (query.shape) filter.shape = query.shape;
        if (query.color) filter.color = query.color;
        if (query.type) filter.type = query.type;
        if (query.line) filter.line = query.line;

        console.log("검색 필터:", filter);

        // 🔍 쿼리 실행
        return await Medicine.find(filter);
    } catch (err) {
        console.error('약품 조회 실패:', err);
        throw err;
    }
};

module.exports = Medicine;
module.exports = { createMedicine, getMedicinesByFilter };
