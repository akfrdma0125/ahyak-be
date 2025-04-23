// routes/exampleRoute.js
const express = require('express');
const jwtUtils = require("../middlewares/jwtUtils");
const {createUser, getUserById, deleteUser} = require("../infra/model/users")
const {log} = require("debug");
const router = express.Router();

router.post('/', (req, res) => {
    let token = jwtUtils.generateTokens(1);
    res.json({ accessToken: token.accessToken, refreshToken: token.refreshToken });
});

router.post('/login', async (req, res) => {
    let email = req.body.email;

    const user = await getUserByEmail(email);
    console.log("사용자 정보:", user);
    if (!user) {
        return res.status(401).json({ message: 'Invalid Login Info' });
    }

    console.log("사용자 ID:", user._id);
    let token = jwtUtils.generateTokens(user._id);
    res.json({accessToken: token.accessToken, refreshToken: token.refreshToken});
});

router.post('/signup', async (req, res) => {
    let nickName = req.body.nickName;
    let email = req.body.email;

    const userId = await createUser(nickName, email)._id;
    console.log("새로운 사용자 ID:", userId);

    if (userId < 0) {
        return res.status(401).json({ message: 'Invalid Login Info' });
    }
    return res.status(200).json({ message: 'Success' });
});

router.post('/refresh', (req, res) => {
    let refreshToken = req.body.refreshToken;

    // refreshToken 검증
    if (!refreshToken) {
        return res.status(401).json({ message: 'Refresh token is missing' });
    }

    let decodedToken = jwtUtils.verifyToken("REFRESH_TOKEN", refreshToken);

    if (!decodedToken || decodedToken.userId < 0) {
        return res.status(401).json({ message: 'Invalid refresh token' });
    }

    // access token 재발급
    let token = jwtUtils.generateTokens(decodedToken.userId);
    res.json({ accessToken: token.accessToken, refreshToken: token.refreshToken });
});

// 회원탈퇴
router.delete("/withdraw", async (req, res) => {
    // JWT 토큰에서 사용자 ID 추출
    const userId = req.user_id;

    // 사용자 ID가 유효한지 확인
    let userInfo = await getUserById(userId);
    if (!userInfo) {
        return res.status(404).json({ message: 'User not found' });
    }
    if (userInfo.isActive === false) {
        return res.status(400).json({ message: 'User already deactivated' });
    }
    await deleteUser(userId); // 실제 삭제 함수 호출

    res.status(200).json({ message: 'User deleted successfully' });
});

module.exports = router;
