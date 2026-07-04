package to.bconnect.api.common;

import lombok.AccessLevel;
import lombok.Getter;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.boot.logging.LogLevel;

@Getter
@RequiredArgsConstructor(access = AccessLevel.PRIVATE)
public enum CommonExceptionCode implements ExceptionCode {
    NOT_VALID ("C001", HttpStatus.BAD_REQUEST, "유효하지 않은 입력값입니다.", LogLevel.INFO),
    TYPE_MISMATCH ("C002", HttpStatus.BAD_REQUEST, "요청 값의 타입이 올바르지 않습니다.", LogLevel.INFO),
    MISSING_PARAMETER ("C003", HttpStatus.BAD_REQUEST, "필수 요청 파라미터가 누락되었습니다.", LogLevel.INFO),
    FORBIDDEN ("C004", HttpStatus.FORBIDDEN, "리소스 접근 권한이 없습니다.", LogLevel.WARN),
    NOT_FOUND ("C005", HttpStatus.NOT_FOUND, "요청한 리소스를 찾을 수 없습니다.", LogLevel.INFO),
    UNSUPPORTED_MEDIA_TYPE ("C006", HttpStatus.UNSUPPORTED_MEDIA_TYPE, "지원하지 않는 미디어 형식입니다.", LogLevel.WARN),
    INTERNAL_SERVER_ERROR ("C007", HttpStatus.INTERNAL_SERVER_ERROR, "서버 내부 오류입니다.", LogLevel.ERROR),
    PATH_NOT_FOUND ("C008", HttpStatus.NOT_FOUND, "요청 경로를 찾을 수 없습니다.", LogLevel.INFO);

    private final String code;
    private final HttpStatus status;
    private final String message;
    private final LogLevel logLevel;
}