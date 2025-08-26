const mongoose = require('mongoose');
const url = process.env.MONGODB_URI;

// ✅ MongoDB 연결
mongoose.connect(url, {
    useNewUrlParser: true,
    useUnifiedTopology: true
}).then(() => console.log('MongoDB 연결 완료!'))
    .catch(err => console.error('MongoDB 연결 실패:', err));