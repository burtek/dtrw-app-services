enum ErrorType {
    BAD_REQUEST = 400,
    UNAUTHORIZED = 403,
    BAD_GATEWAY = 502,
    SERVICE_UNAVAILABLE = 503
}

export class AppError extends Error {
    private constructor(readonly type: ErrorType, message: string) {
        super(message);
    }

    static badGateway(message: string) {
        return new AppError(ErrorType.BAD_GATEWAY, message);
    }

    static badRequest(message: string) {
        return new AppError(ErrorType.BAD_REQUEST, message);
    }

    static serviceUnavailable(message: string) {
        return new AppError(ErrorType.SERVICE_UNAVAILABLE, message);
    }

    static unauthorized(message: string) {
        return new AppError(ErrorType.UNAUTHORIZED, message);
    }
}
