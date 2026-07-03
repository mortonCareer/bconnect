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
    NOT_PROJECT_TASK("OF001", HttpStatus.BAD_REQUEST, "프로젝트 작업에만 제안할 수 있습니다.", LogLevel.INFO),
    INVALID_STATUS("OF002", HttpStatus.CONFLICT, "처리할 수 없는 제안 상태입니다.", LogLevel.INFO),
    INVALID_REORDER("OF003", HttpStatus.BAD_REQUEST, "재정렬 대상이 올바르지 않습니다.", LogLevel.INFO);

    private final String code;
    private final HttpStatus status;
    private final String message;
    private final LogLevel logLevel;
}
