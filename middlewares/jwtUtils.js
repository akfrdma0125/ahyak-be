const jwt = require('jsonwebtoken');

// 환경 변수 설정 - 변수명과 환경변수명 일치
const ACCESS_SECRET_KEY = process.env.ACCESS_SECRET_KEY;
const REFRESH_SECRET_KEY = process.env.REFRESH_SECRET_KEY;

// 인증이 필요 없는 경로들 (화이트리스트 방식)
const PUBLIC_PATHS = [
    '/auth/login',
    '/auth/register',
    '/auth/withdraw'
];

// 토큰 타입 상수
const TOKEN_TYPES = {
    ACCESS: 'ACCESS_TOKEN',
    REFRESH: 'REFRESH_TOKEN'
};

const EXPIRY_DATES = {
    ACCESS: '14d',
    REFRESH: '21d'
}

/**
 * 토큰 생성 함수
 * @param {string} userId - 사용자 ID
 * @returns {Object} accessToken과 refreshToken
 */
function generateTokens(userId) {
    if (!ACCESS_SECRET_KEY || !REFRESH_SECRET_KEY) {
        throw new Error('JWT secret keys are not configured');
    }

    const accessToken = jwt.sign(
        { userId, type: TOKEN_TYPES.ACCESS }, 
        ACCESS_SECRET_KEY, 
        { expiresIn: EXPIRY_DATES.ACCESS }
    );
    
    const refreshToken = jwt.sign(
        { userId, type: TOKEN_TYPES.REFRESH }, 
        REFRESH_SECRET_KEY, 
        { expiresIn: EXPIRY_DATES.REFRESH }
    );

    return { accessToken, refreshToken };
}

/**
 * 토큰 검증 함수
 * @param {string} type - 토큰 타입 ('ACCESS_TOKEN' 또는 'REFRESH_TOKEN')
 * @param {string} token - 검증할 토큰
 * @returns {Object} 검증된 토큰 페이로드
 * @throws {Error} 잘못된 토큰 타입이나 토큰
 */
function verifyToken(type, token) {
    if (!token) {
        throw new Error('Token is required');
    }

    let secretKey;
    let expectedType;

    switch (type) {
        case TOKEN_TYPES.ACCESS:
            secretKey = ACCESS_SECRET_KEY;
            expectedType = TOKEN_TYPES.ACCESS;
            break;
        case TOKEN_TYPES.REFRESH:
            secretKey = REFRESH_SECRET_KEY;
            expectedType = TOKEN_TYPES.REFRESH;
            break;
        default:
            throw new Error(`Invalid token type: ${type}`);
    }

    if (!secretKey) {
        throw new Error('JWT secret key is not configured');
    }

    try {
        const decoded = jwt.verify(token, secretKey);
        
        // 토큰 타입 검증
        if (decoded.type !== expectedType) {
            throw new Error('Token type mismatch');
        }

        return decoded;
    } catch (error) {
        if (error.name === 'TokenExpiredError') {
            throw new Error('Token has expired');
        } else if (error.name === 'JsonWebTokenError') {
            throw new Error('Invalid token');
        }
        throw error;
    }
}

/**
 * Authorization 헤더에서 토큰 파싱
 * @param {string} authHeader - Authorization 헤더 값
 * @returns {string|null} 파싱된 토큰 또는 null
 */
function parseAuthHeader(authHeader) {
    if (!authHeader) {
        return null;
    }

    const parts = authHeader.split(' ');
    
    if (parts.length !== 2 || parts[0] !== 'Bearer') {
        return null;
    }

    return parts[1];
}

/**
 * JWT 인증 미들웨어
 * @param {Object} req - Express request 객체
 * @param {Object} res - Express response 객체
 * @param {Function} next - Express next 함수
 */
function authenticateToken(req, res, next) {
    // 공개 경로 체크
    if (PUBLIC_PATHS.includes(req.path)) {
        return next();
    }

    // Authorization 헤더 파싱
    const authHeader = req.header('Authorization');
    const token = parseAuthHeader(authHeader);

    if (!token) {
        return res.status(401).json({ 
            message: 'Authorization header is required',
            error: 'MISSING_AUTH_HEADER'
        });
    }

    try {
        // 토큰 검증
        const decoded = verifyToken(TOKEN_TYPES.ACCESS, token);
        
        // 사용자 정보를 request 객체에 추가
        req.user_id = decoded.userId;
        req.user = decoded;
        
        next();
    } catch (error) {
        let statusCode = 401;
        let errorCode = 'INVALID_TOKEN';

        if (error.message === 'Token has expired') {
            statusCode = 401;
            errorCode = 'TOKEN_EXPIRED';
        } else if (error.message === 'Token type mismatch') {
            statusCode = 403;
            errorCode = 'TOKEN_TYPE_MISMATCH';
        }

        return res.status(statusCode).json({
            message: error.message,
            error: errorCode
        });
    }
}

/**
 * Refresh Token 검증 미들웨어
 * @param {Object} req - Express request 객체
 * @param {Object} res - Express response 객체
 * @param {Function} next - Express next 함수
 */
function authenticateRefreshToken(req, res, next) {
    const { refreshToken } = req.body;

    if (!refreshToken) {
        return res.status(400).json({
            message: 'Refresh token is required',
            error: 'MISSING_REFRESH_TOKEN'
        });
    }

    try {
        const decoded = verifyToken(TOKEN_TYPES.REFRESH, refreshToken);
        req.user_id = decoded.userId;
        req.user = decoded;
        next();
    } catch (error) {
        return res.status(401).json({
            message: error.message,
            error: 'INVALID_REFRESH_TOKEN'
        });
    }
}

module.exports = {
    authenticateToken,
    authenticateRefreshToken,
    generateTokens,
    verifyToken,
    TOKEN_TYPES
};
