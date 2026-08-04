package to.bconnect.api.core.domain.credential;

import lombok.AccessLevel;
import lombok.Getter;
import lombok.RequiredArgsConstructor;
import org.springframework.boot.logging.LogLevel;
import org.springframework.http.HttpStatus;
import to.bconnect.api.common.ExceptionCode;

@Getter
@RequiredArgsConstructor(access = AccessLevel.PRIVATE)
public enum CredentialExceptionCode implements ExceptionCode {
    INVALID_STATUS("CD001", HttpStatus.CONFLICT, "처리할 수 없는 자격 증명 상태입니다.", LogLevel.INFO);

    private final String code;
    private final HttpStatus status;
    private final String message;
    private final LogLevel logLevel;
}
