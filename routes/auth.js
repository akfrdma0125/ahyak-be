// routes/exampleRoute.js
const express = require('express');
const jwtUtils = require("../middlewares/jwtUtils");
const {createUser, getUserByEmail} = require("../infra/model/users")
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

module.exports = router;
