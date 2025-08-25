const dailyStatusService = require("../services/dailyStatusService");

/**
 * 공통 유효성 검사 함수들
 */
const validators = {
    /**
     * Date 유효성 검사
     * @param {string} date - 검사할 날짜 문자열
     * @returns {Object} { isValid: boolean, parsedDate: Date|null, error: Object|null }
     */
    validateDate: (date) => {
        if (!date) {
            return {
                isValid: false,
                parsedDate: null,
                error: {
                    status: 400,
                    message: "Date is required",
                    error: "MISSING_DATE"
                }
            };
        }

        const parsedDate = new Date(date);
        if (isNaN(parsedDate.getTime())) {
            return {
                isValid: false,
                parsedDate: null,
                error: {
                    status: 400,
                    message: "Invalid date format",
                    error: "INVALID_DATE_FORMAT"
                }
            };
        }

        return {
            isValid: true,
            parsedDate: parsedDate,
            error: null
        };
    },

    /**
     * Discomforts 배열 유효성 검사
     * @param {Array} discomforts - 검사할 불편함 증상 배열
     * @returns {Object} { isValid: boolean, error: Object|null }
     */
    validateDiscomforts: (discomforts) => {
        if (discomforts === undefined || discomforts === null) {
            return { isValid: true, error: null }; // 선택적 필드
        }

        if (!Array.isArray(discomforts)) {
            return {
                isValid: false,
                error: {
                    status: 400,
                    message: "Discomforts must be an array",
                    error: "INVALID_DISCOMFORTS_FORMAT"
                }
            };
        }

        // 각 discomfort 항목 검사
        for (let i = 0; i < discomforts.length; i++) {
            const discomfort = discomforts[i];
            
            if (!discomfort.description || typeof discomfort.description !== 'string') {
                return {
                    isValid: false,
                    error: {
                        status: 400,
                        message: `Discomfort at index ${i} must have a valid description`,
                        error: "INVALID_DISCOMFORT_DESCRIPTION"
                    }
                };
            }
            
            if (discomfort.severity !== undefined) {
                if (typeof discomfort.severity !== 'number' || discomfort.severity < 1 || discomfort.severity > 5) {
                    return {
                        isValid: false,
                        error: {
                            status: 400,
                            message: `Discomfort at index ${i}: severity must be a number between 1 and 5`,
                            error: "INVALID_SEVERITY"
                        }
                    };
                }
            }
        }

        return { isValid: true, error: null };
    },

    /**
     * AdditionalInfo 유효성 검사
     * @param {string} additionalInfo - 검사할 추가 정보
     * @returns {Object} { isValid: boolean, error: Object|null }
     */
    validateAdditionalInfo: (additionalInfo) => {
        if (additionalInfo !== undefined && additionalInfo !== null && typeof additionalInfo !== 'string') {
            return {
                isValid: false,
                error: {
                    status: 400,
                    message: "Additional info must be a string",
                    error: "INVALID_ADDITIONAL_INFO"
                }
            };
        }

        return { isValid: true, error: null };
    }
};

/**
 * 공통 에러 응답 함수
 * @param {Object} res - Express response 객체
 * @param {Object} error - 에러 객체
 */
const sendErrorResponse = (res, error) => {
    const status = error.status || 500;
    const message = error.message || "Internal server error";
    const errorCode = error.error || "INTERNAL_SERVER_ERROR";

    res.status(status).json({
        status: "error",
        message: message,
        error: errorCode
    });
};

/**
 * 일일 상태 생성
 */
const createDailyStatus = async (req, res) => {
    try {
        const { date, discomforts, additionalInfo } = req.body;
        const userId = req.user_id;

        // Date 유효성 검사
        const dateValidation = validators.validateDate(date);
        if (!dateValidation.isValid) {
            return sendErrorResponse(res, dateValidation.error);
        }

        // Discomforts 유효성 검사
        const discomfortsValidation = validators.validateDiscomforts(discomforts);
        if (!discomfortsValidation.isValid) {
            return sendErrorResponse(res, discomfortsValidation.error);
        }

        // AdditionalInfo 유효성 검사
        const additionalInfoValidation = validators.validateAdditionalInfo(additionalInfo);
        if (!additionalInfoValidation.isValid) {
            return sendErrorResponse(res, additionalInfoValidation.error);
        }

        const newStatus = await dailyStatusService.createDailyStatus(
            userId, 
            dateValidation.parsedDate, 
            discomforts, 
            additionalInfo
        );
        
        res.status(201).json({ 
            status: "success", 
            data: newStatus 
        });
    } catch (error) {
        console.error("createDailyStatus error:", error);
        sendErrorResponse(res, { message: "Failed to create daily status" });
    }
};

/**
 * 일일 상태 조회
 */
const getDailyStatus = async (req, res) => {
    try {
        const { date } = req.params;
        const userId = req.user_id;

        // Date 유효성 검사
        const dateValidation = validators.validateDate(date);
        if (!dateValidation.isValid) {
            return sendErrorResponse(res, dateValidation.error);
        }

        const dailyStatus = await dailyStatusService.getDailyStatus(userId, dateValidation.parsedDate);
        
        if (!dailyStatus) {
            return sendErrorResponse(res, {
                status: 404,
                message: "Daily status not found",
                error: "NOT_FOUND"
            });
        }

        res.json({ 
            status: "success", 
            data: dailyStatus 
        });
    } catch (error) {
        console.error("getDailyStatus error:", error);
        sendErrorResponse(res, { message: "Failed to get daily status" });
    }
};

/**
 * 불편함 증상 추가
 */
const addDiscomforts = async (req, res) => {
    try {
        const { date, discomforts } = req.body;
        const userId = req.user_id;

        // Date 유효성 검사
        const dateValidation = validators.validateDate(date);
        if (!dateValidation.isValid) {
            return sendErrorResponse(res, dateValidation.error);
        }

        // Discomforts 유효성 검사
        const discomfortsValidation = validators.validateDiscomforts(discomforts);
        if (!discomfortsValidation.isValid) {
            return sendErrorResponse(res, discomfortsValidation.error);
        }

        const updatedStatus = await dailyStatusService.addDiscomforts(userId, dateValidation.parsedDate, discomforts);
        
        res.json({ 
            status: "success", 
            data: updatedStatus 
        });
    } catch (error) {
        console.error("addDiscomforts error:", error);
        sendErrorResponse(res, { message: "Failed to add discomforts" });
    }
};

/**
 * 추가 정보 업데이트
 */
const updateAdditionalInfo = async (req, res) => {
    try {
        const { date, additionalInfo } = req.body;
        const userId = req.user_id;

        // Date 유효성 검사
        const dateValidation = validators.validateDate(date);
        if (!dateValidation.isValid) {
            return sendErrorResponse(res, dateValidation.error);
        }

        // AdditionalInfo 유효성 검사
        const additionalInfoValidation = validators.validateAdditionalInfo(additionalInfo);
        if (!additionalInfoValidation.isValid) {
            return sendErrorResponse(res, additionalInfoValidation.error);
        }

        const updatedStatus = await dailyStatusService.addAdditionalInfo(userId, dateValidation.parsedDate, additionalInfo);
        
        res.json({ 
            status: "success", 
            data: updatedStatus 
        });
    } catch (error) {
        console.error("updateAdditionalInfo error:", error);
        sendErrorResponse(res, { message: "Failed to update additional info" });
    }
};

/**
 * 일일 상태 삭제
 */
const deleteDailyStatus = async (req, res) => {
    try {
        const { date } = req.params;
        const userId = req.user_id;

        // Date 유효성 검사
        const dateValidation = validators.validateDate(date);
        if (!dateValidation.isValid) {
            return sendErrorResponse(res, dateValidation.error);
        }

        const deletedStatus = await dailyStatusService.deleteDailyStatus(userId, dateValidation.parsedDate);
        
        if (!deletedStatus) {
            return sendErrorResponse(res, {
                status: 404,
                message: "Daily status not found",
                error: "NOT_FOUND"
            });
        }

        res.json({ 
            status: "success", 
            message: "Daily status deleted successfully",
            data: deletedStatus 
        });
    } catch (error) {
        console.error("deleteDailyStatus error:", error);
        sendErrorResponse(res, { message: "Failed to delete daily status" });
    }
};

module.exports = { 
    createDailyStatus,
    getDailyStatus,
    addDiscomforts,
    updateAdditionalInfo,
    deleteDailyStatus
};