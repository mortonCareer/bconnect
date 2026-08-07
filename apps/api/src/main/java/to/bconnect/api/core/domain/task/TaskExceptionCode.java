package to.bconnect.api.core.domain.task;

import lombok.AccessLevel;
import lombok.Getter;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.boot.logging.LogLevel;
import to.bconnect.api.common.ExceptionCode;

@Getter
@RequiredArgsConstructor(access = AccessLevel.PRIVATE)
public enum TaskExceptionCode implements ExceptionCode {
    NOT_ASSIGNED("T001", HttpStatus.CONFLICT, "기술자에게 할당되지 않은 작업입니다.", LogLevel.INFO),
    INVALID_TYPE("T002", HttpStatus.CONFLICT, "처리할 수 없는 작업 유형입니다.", LogLevel.INFO),
    OFFERED_EXISTS("T003", HttpStatus.CONFLICT, "섭외 중이거나 배정된 작업이 있어 삭제할 수 없습니다.", LogLevel.INFO);

    private final String code;
    private final HttpStatus status;
    private final String message;
    private final LogLevel logLevel;
}
