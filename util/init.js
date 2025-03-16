const fs = require('fs');
const path = require('path');
const mongoose = require('mongoose');
const csv = require('csv-parser'); // CSV 파싱 라이브러리
const Medicine = require('../infra/model/medicine');

// ✅ CSV 파일 경로
const csvFilePath = path.join(__dirname, '/data/drug_info.csv');

// ✅ CSV 데이터를 MongoDB에 저장하는 함수
const importCSV = async () => {
    let medicines = [];

    fs.createReadStream(csvFilePath)
        .pipe(csv()) // CSV 데이터를 JSON 객체로 변환
        .on('data', (row) => {
            medicines.push({
                seq: row.ITEM_SEQ,
                name: row.ITEM_NAME,
                print: row.PRINT,
                shape: row.DRUG_SHAPE,
                color: row.COLOR,
                type: row.TYPE,
                line: row.LINE,
                tokenized: row.TOKENIZED
            });
        })
        .on('end', async () => {
            try {
                const batchSize = 1000;
                for (let i = 0; i < medicines.length; i += batchSize) {
                    await Medicine.insertMany(medicines.slice(i, i + batchSize));
                }

                console.log('MongoDB 저장 완료!');
            } catch (err) {
                console.log(typeof Medicine.insertMany); // 'function'이 나와야 함
                console.error('MongoDB 저장 실패:', err);
            }
        });
};

// ✅ 실행
importCSV();
