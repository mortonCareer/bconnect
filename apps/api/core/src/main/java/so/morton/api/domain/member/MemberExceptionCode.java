package so.morton.api.domain.member;

import lombok.AccessLevel;
import lombok.Getter;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.boot.logging.LogLevel;
import so.morton.api.support.ExceptionCode;

@Getter
@RequiredArgsConstructor(access = AccessLevel.PRIVATE)
public enum MemberExceptionCode implements ExceptionCode {
    DUPLICATE_USERNAME ("M001", HttpStatus.CONFLICT, "이미 사용 중인 사용자명입니다.", LogLevel.INFO),
    DUPLICATE_PHONE ("M002", HttpStatus.CONFLICT, "이미 사용 중인 전화번호입니다.", LogLevel.INFO);

    private final String code;
    private final HttpStatus status;
    private final String message;
    private final LogLevel logLevel;
}
