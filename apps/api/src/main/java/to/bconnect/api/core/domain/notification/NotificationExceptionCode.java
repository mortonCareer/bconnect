package to.bconnect.api.core.domain.notification;

import lombok.AccessLevel;
import lombok.Getter;
import lombok.RequiredArgsConstructor;
import org.springframework.boot.logging.LogLevel;
import org.springframework.http.HttpStatus;
import to.bconnect.api.common.ExceptionCode;

@Getter
@RequiredArgsConstructor(access = AccessLevel.PRIVATE)
public enum NotificationExceptionCode implements ExceptionCode {
    NOT_FOUND    ("NT001", HttpStatus.NOT_FOUND,             "존재하지 않는 알림입니다.",        LogLevel.INFO),
    FORBIDDEN    ("NT002", HttpStatus.FORBIDDEN,             "해당 알림에 접근할 수 없습니다.",   LogLevel.WARN),
    UNKNOWN_TYPE ("NT003", HttpStatus.INTERNAL_SERVER_ERROR, "정의되지 않은 알림 타입입니다.",    LogLevel.ERROR);

    private final String code;
    private final HttpStatus status;
    private final String message;
    private final LogLevel logLevel;
}
