package to.bconnect.api.core.domain.company;

import lombok.AccessLevel;
import lombok.Getter;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.boot.logging.LogLevel;
import to.bconnect.api.common.ExceptionCode;

@Getter
@RequiredArgsConstructor(access = AccessLevel.PRIVATE)
public enum CompanyExceptionCode implements ExceptionCode {
    ALREADY_EXISTS ("CO001", HttpStatus.CONFLICT, "이미 업체가 존재합니다.", LogLevel.INFO),
    DUPLICATE_BRN ("CO002", HttpStatus.CONFLICT, "이미 등록된 사업자등록번호입니다.", LogLevel.INFO),
    PROJECT_LIMIT_EXCEEDED ("CO003", HttpStatus.CONFLICT, "생성 가능한 프로젝트 수를 초과했습니다.", LogLevel.INFO);

    private final String code;
    private final HttpStatus status;
    private final String message;
    private final LogLevel logLevel;
}
