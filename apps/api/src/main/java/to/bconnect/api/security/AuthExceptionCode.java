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
    OTP_MAX_ATTEMPTS ("A003", HttpStatus.BAD_REQUEST, "인증 시도 횟수를 초과했습니다.", LogLevel.INFO),
    INVALID_OTP ("A004", HttpStatus.BAD_REQUEST, "유효하지 않은 인증번호입니다.", LogLevel.INFO),
    OTP_EXPIRED ("A005", HttpStatus.BAD_REQUEST, "만료된 인증번호입니다.", LogLevel.INFO),
    INVALID_SIGNUP_TOKEN ("A006", HttpStatus.BAD_REQUEST, "유효하지 않은 가입 토큰입니다.", LogLevel.INFO),
    SIGNUP_TOKEN_EXPIRED ("A007", HttpStatus.BAD_REQUEST, "만료된 가입 토큰입니다.", LogLevel.INFO),
    INVALID_SESSION ("A008", HttpStatus.UNAUTHORIZED, "유효하지 않은 세션입니다.", LogLevel.INFO),
    INVALID_JWT_TOKEN ("A009", HttpStatus.UNAUTHORIZED, "유효하지 않은 토큰입니다.", LogLevel.WARN),
    EXPIRED_JWT_TOKEN ("A010", HttpStatus.UNAUTHORIZED, "만료된 토큰입니다.", LogLevel.INFO),
    INVALID_TOKEN_TYPE ("A011", HttpStatus.UNAUTHORIZED, "토큰 유형이 올바르지 않습니다.", LogLevel.WARN);

    private final String code;
    private final HttpStatus status;
    private final String message;
    private final LogLevel logLevel;
}
