package to.bconnect.api.core.domain.drive;

import lombok.AccessLevel;
import lombok.Getter;
import lombok.RequiredArgsConstructor;
import org.springframework.boot.logging.LogLevel;
import org.springframework.http.HttpStatus;
import to.bconnect.api.common.ExceptionCode;

@Getter
@RequiredArgsConstructor(access = AccessLevel.PRIVATE)
public enum DriveExceptionCode implements ExceptionCode {
    LIMIT_EXCEEDED("DR001", HttpStatus.CONFLICT, "드라이브 용량 한도를 초과했습니다.", LogLevel.INFO);

    private final String code;
    private final HttpStatus status;
    private final String message;
    private final LogLevel logLevel;
}
