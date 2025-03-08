// routes/exampleRoute.js
const express = require('express');
const jwtUtils = require("../middlewares/jwtUtils");
const {createUser, getAllUsers} = require("../infra/database")
const {log} = require("debug");
const router = express.Router();

router.post('/', (req, res) => {
    let token = jwtUtils.generateTokens(1);
    res.json({ accessToken: token.accessToken, refreshToken: token.refreshToken });
});

router.post('/login', async (req, res) => {
    let nickName = req.body.nickName;
    let email = req.body.email;

    const userId = await createUser(nickName, email);
    console.log("새로운 사용자 ID:", userId);

    if (userId < 0) {
        return res.status(401).json({ message: 'Invalid Login Info' });
    }

    // DB 등록
    let token = jwtUtils.generateTokens(userId);
    res.json({accessToken: token.accessToken, refreshToken: token.refreshToken});
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

module.exports = router;
