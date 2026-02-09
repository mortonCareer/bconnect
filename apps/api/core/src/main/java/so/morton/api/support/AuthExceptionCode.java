package so.morton.api.support;

import lombok.AccessLevel;
import lombok.Getter;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;

@Getter
@RequiredArgsConstructor(access = AccessLevel.PRIVATE)
public enum AuthExceptionCode implements ExceptionCode {
    OTP_RATE_LIMIT("A001", HttpStatus.TOO_MANY_REQUESTS, "OTP 발송 제한을 초과했습니다."),
    INVALID_OTP("A002", HttpStatus.BAD_REQUEST, "유효하지 않은 인증번호입니다."),
    OTP_EXPIRED("A003", HttpStatus.BAD_REQUEST, "인증번호가 만료되었습니다."),
    OTP_MAX_ATTEMPTS("A004", HttpStatus.BAD_REQUEST, "인증 시도 횟수를 초과했습니다."),
    INVALID_REFRESH_TOKEN("A005", HttpStatus.UNAUTHORIZED, "유효하지 않은 리프레시 토큰입니다."),
    INVALID_ACCESS_TOKEN("A006", HttpStatus.UNAUTHORIZED, "유효하지 않은 액세스 토큰입니다.");

    private final String code;
    private final HttpStatus status;
    private final String message;
}
