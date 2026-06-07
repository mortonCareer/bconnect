package to.bconnect.api.core.domain.coworker;

import lombok.AccessLevel;
import lombok.Getter;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.boot.logging.LogLevel;
import to.bconnect.api.common.ExceptionCode;

@Getter
@RequiredArgsConstructor(access = AccessLevel.PRIVATE)
public enum CoworkerExceptionCode implements ExceptionCode {
    SELF_REQUEST("CW001", HttpStatus.BAD_REQUEST, "자기 자신에게 동료 요청을 보낼 수 없습니다.", LogLevel.INFO),
    ALREADY_COWORKER("CW002", HttpStatus.CONFLICT, "이미 동료인 사용자입니다.", LogLevel.INFO),
    TARGET_NOT_FOUND("CW003", HttpStatus.NOT_FOUND, "요청 대상 프로필을 찾을 수 없습니다.", LogLevel.INFO),
    REQUEST_NOT_FOUND("CW004", HttpStatus.NOT_FOUND, "동료 요청을 찾을 수 없습니다.", LogLevel.INFO),
    ALREADY_REQUESTED("CW005", HttpStatus.CONFLICT, "이미 동료 요청을 보낸 사용자입니다.", LogLevel.INFO),
    NOT_FOUND("CW006", HttpStatus.NOT_FOUND, "동료 관계를 찾을 수 없습니다.", LogLevel.INFO);

    private final String code;
    private final HttpStatus status;
    private final String message;
    private final LogLevel logLevel;
}
