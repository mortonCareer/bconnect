package to.bconnect.api.core.domain.offer;

import lombok.AccessLevel;
import lombok.Getter;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.boot.logging.LogLevel;
import to.bconnect.api.common.ExceptionCode;

@Getter
@RequiredArgsConstructor(access = AccessLevel.PRIVATE)
public enum OfferExceptionCode implements ExceptionCode {
    NOT_FOUND("OF001", HttpStatus.NOT_FOUND, "제안을 찾을 수 없습니다.", LogLevel.INFO),
    ALREADY_OFFERED("OF002", HttpStatus.CONFLICT, "이미 제안한 작업자입니다.", LogLevel.INFO),
    WORKER_NOT_FOUND("OF003", HttpStatus.NOT_FOUND, "제안 대상 작업자를 찾을 수 없습니다.", LogLevel.INFO),
    NOT_PROJECT_TASK("OF004", HttpStatus.BAD_REQUEST, "프로젝트 작업에만 제안할 수 있습니다.", LogLevel.INFO),
    INVALID_STATUS("OF005", HttpStatus.CONFLICT, "처리할 수 없는 제안 상태입니다.", LogLevel.INFO),
    INVALID_REORDER("OF006", HttpStatus.BAD_REQUEST, "재정렬 대상이 올바르지 않습니다.", LogLevel.INFO);

    private final String code;
    private final HttpStatus status;
    private final String message;
    private final LogLevel logLevel;
}
