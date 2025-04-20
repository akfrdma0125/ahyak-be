const jwt = require('jsonwebtoken');
const {log} = require("debug");

const ACCESS_TOKEN_SECRET = process.env.ACCESS_SECRET_KEY
const REFRESH_TOKEN_SECRET = process.env.REFRESH_SECRET_KEY

// 로그인 시 실행 (사용자 인증 후)
function generateTokens(userId) {
    log(ACCESS_TOKEN_SECRET)
    const accessToken = jwt.sign({ userId }, ACCESS_TOKEN_SECRET, { expiresIn: '21d' });
    const refreshToken = jwt.sign({ userId }, REFRESH_TOKEN_SECRET, { expiresIn: '14d' });

    return { accessToken, refreshToken };
}

// token 검증
function verifyToken(type, token) {
    if (type === "ACCESS_TOKEN") {
        return jwt.verify(token, ACCESS_TOKEN_SECRET);
    }else {
        return jwt.verify(token, REFRESH_TOKEN_SECRET);
    }
}

// 헤더 Authorization 에서 accessToken 파싱
function authenticateToken(req, res, next) {
    if (req.path.startsWith('/auth')) {
        return next(); // 로그인, 회원가입은 JWT 검사 안 함
    }
    const token = req.header('Authorization')?.split(' ')[1]; // Bearer {token}

    if (!token) return res.status(401).json({ message: 'Unauthorized' });

    jwt.verify(token, ACCESS_TOKEN_SECRET, (err, user) => {
        if (err) return res.status(403).json({ message: 'Invalid token' });
        req.user_id = user.userId;
        next();
    });
}

module.exports = {authenticateToken, generateTokens, verifyToken}



