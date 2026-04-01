package so.morton.api.domain.profile;

import lombok.AccessLevel;
import lombok.Getter;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.boot.logging.LogLevel;
import so.morton.api.support.ExceptionCode;

@Getter
@RequiredArgsConstructor(access = AccessLevel.PRIVATE)
public enum ProfileExceptionCode implements ExceptionCode {
    ALREADY_EXISTS ("P001", HttpStatus.CONFLICT, "이미 프로필이 존재합니다.", LogLevel.INFO),
    INVALID_PRIMARY_TRADE ("P002", HttpStatus.BAD_REQUEST, "대표 공종은 선택한 공종 중에서만 지정할 수 있습니다.", LogLevel.INFO);

    private final String code;
    private final HttpStatus status;
    private final String message;
    private final LogLevel logLevel;
}
