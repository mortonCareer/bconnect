package to.bconnect.api.security;

import lombok.AccessLevel;
import lombok.Getter;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.boot.logging.LogLevel;
import to.bconnect.api.common.ExceptionCode;

@Getter
@RequiredArgsConstructor(access = AccessLevel.PRIVATE)
public enum AuthExceptionCode implements ExceptionCode {
    OTP_DAILY_LIMIT ("A001", HttpStatus.TOO_MANY_REQUESTS, "일일 발송 한도를 초과했습니다.", LogLevel.INFO),
    OTP_RATE_LIMIT ("A002", HttpStatus.TOO_MANY_REQUESTS, "재전송 대기 시간이 지나지 않았습니다.", LogLevel.INFO),
    INVALID_OTP ("A003", HttpStatus.BAD_REQUEST, "유효하지 않은 인증번호입니다.", LogLevel.INFO),
    OTP_REVOKED("A004", HttpStatus.BAD_REQUEST, "인증번호가 만료되었습니다.", LogLevel.INFO),
    OTP_MAX_ATTEMPTS ("A005", HttpStatus.BAD_REQUEST, "인증 시도 횟수를 초과했습니다.", LogLevel.INFO),
    INVALID_REFRESH_TOKEN ("A006", HttpStatus.UNAUTHORIZED, "유효하지 않은 리프레시 토큰입니다.", LogLevel.WARN),
    INVALID_ACCESS_TOKEN ("A007", HttpStatus.UNAUTHORIZED, "유효하지 않은 액세스 토큰입니다.", LogLevel.WARN),
    SESSION_EXPIRED ("A008", HttpStatus.UNAUTHORIZED, "세션이 만료되었습니다.", LogLevel.INFO),
    INVALID_SIGNUP_TOKEN ("A009", HttpStatus.BAD_REQUEST, "유효하지 않은 가입 토큰입니다.", LogLevel.INFO),
    SIGNUP_TOKEN_REVOKED("A010", HttpStatus.BAD_REQUEST, "가입 토큰이 만료되었습니다.", LogLevel.INFO);

    private final String code;
    private final HttpStatus status;
    private final String message;
    private final LogLevel logLevel;
}
