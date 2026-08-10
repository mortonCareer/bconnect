package to.bconnect.api.oneclick.domain;

import lombok.AccessLevel;
import lombok.Getter;
import lombok.RequiredArgsConstructor;
import org.springframework.boot.logging.LogLevel;
import org.springframework.http.HttpStatus;
import to.bconnect.api.common.ExceptionCode;

@Getter
@RequiredArgsConstructor(access = AccessLevel.PRIVATE)
// 원클릭 예외 코드
public enum OneClickExceptionCode implements ExceptionCode {
    VALIDATION_FAILED("OC001", HttpStatus.BAD_REQUEST, "사업자 정보가 일치하지 않습니다.", LogLevel.INFO),
    SERVICE_UNAVAILABLE("OC002", HttpStatus.SERVICE_UNAVAILABLE, "사업자 조회 서비스가 일시적으로 원활하지 않습니다.", LogLevel.WARN);

    private final String code;
    private final HttpStatus status;
    private final String message;
    private final LogLevel logLevel;
}
