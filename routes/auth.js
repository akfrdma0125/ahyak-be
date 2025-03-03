// routes/exampleRoute.js
const express = require('express');
const jwtUtils = require("../middlewares/jwtUtils");
const {log} = require("debug");
const router = express.Router();

router.post('/', (req, res) => {
    let token = jwtUtils.generateTokens(1);
    res.json({ accessToken: token.accessToken, refreshToken: token.refreshToken });
});

router.post('/login', (req, res) => {
    let userId = req.body.userId;
    let email = req.body.email;
    // 유효성 체크
    // DB 등록
    let token = jwtUtils.generateTokens(userId);
    res.json({ accessToken: token.accessToken, refreshToken: token.refreshToken });
});

router.post('/refresh', (req, res) => {
    // refresh token 검증
    let refreshToken = req.body.refreshToken;
    // TODO: 만료 되었을 경우 응답 체크
    if (refreshToken == null || jwtUtils.verifyToken(refreshToken) == null) {
        log(jwtUtils.verifyToken("REFRESH_TOKEN", refreshToken));
        res.sendStatus(401);
        res.json({ message: 'Invalid refresh token' });
        return;
    }
    let userId = jwtUtils.verifyToken(refreshToken).userId;
    // access token 재발급
    let token = jwtUtils.generateTokens(userId);
    res.json({ accessToken : token.accessToken, refreshToken: token.refreshToken });
});

module.exports = router;
