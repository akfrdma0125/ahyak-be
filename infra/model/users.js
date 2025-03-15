const mongoose = require('mongoose');

const { Schema, model } = mongoose;
const url = process.env.DB_URL;

// ✅ User 스키마 정의
const UserSchema = new Schema({
    name: { type: String, required: true },
    email: { type: String, required: true, unique: true },
    isActive: { type: Boolean, default: true } // Soft Delete
});

const User = model('User', UserSchema);

// ✅ MongoDB 연결
mongoose.connect(url, {
    useNewUrlParser: true,
    useUnifiedTopology: true
}).then(() => console.log('MongoDB 연결 완료!'))
    .catch(err => console.error('MongoDB 연결 실패:', err));

// ✅ CRUD 함수 정의
const createUser = async (name, email) => {
    try {
        const newUser = new User({ name, email });
        await newUser.save();
        return newUser;
    } catch (err) {
        console.error('User 생성 실패:', err);
    }
};

const getAllUsers = async () => {
    try {
        return await User.find({ isActive: true });
    } catch (err) {
        console.error('전체 사용자 조회 실패:', err);
    }
};

const getUserByEmail = async (email) => {
    try {
        return await User.findOne({email: email});
    } catch (err) {
        console.error('사용자 조회 실패:', err);
        return -1;
    }
};

const deleteUser = async (email) => {
    try {
        return await User.findOneAndDelete({ email: email });
    } catch (err) {
        console.error('User 삭제 실패:', err);
    }
};

const deactivateUser = async (email) => {
    try {
        return await User.findOneAndUpdate({ email }, { isActive: false }, { new: true });
    } catch (err) {
        console.error('User 비활성화 실패:', err);
    }
};

// ✅ CRUD 함수 내보내기
module.exports = {
    createUser,
    getAllUsers,
    deleteUser,
    deactivateUser,
    getUserByEmail
};
