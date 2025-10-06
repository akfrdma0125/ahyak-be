const mongoose = require('mongoose');
const url = process.env.MONGODB_URI || process.env.MONGODB_URL;

// 환경변수 검증: 누락 시 명확한 오류를 내고 즉시 중단
if (!url || typeof url !== 'string' || url.trim() === '') {
    // 값 일부만 로깅하여 유무 확인(보안 고려)
    console.error('MongoDB 연결 실패: MONGODB_URI 환경변수가 설정되지 않았습니다.');
    throw new Error('Missing required env var: MONGODB_URI');
}

// ✅ MongoDB 연결
mongoose.connect(url, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
    // 연결 탐색 타임아웃을 늘려 원인 파악 용이
    serverSelectionTimeoutMS: 30000
}).then(() => console.log('MongoDB 연결 완료!'))
    .catch(err => {
        console.error('MongoDB 연결 실패:', err);
        // 연결 실패 시 프로세스를 종료하여 재시작/알림 유도
        process.exit(1);
    });