package so.morton.api.domain.recommendation;

import lombok.AccessLevel;
import lombok.Getter;
import lombok.RequiredArgsConstructor;
import org.springframework.boot.logging.LogLevel;
import org.springframework.http.HttpStatus;
import so.morton.api.support.ExceptionCode;

@Getter
@RequiredArgsConstructor(access = AccessLevel.PRIVATE)
public enum RecommendationExceptionCode implements ExceptionCode {
    SELF_RECOMMENDATION("RC001", HttpStatus.BAD_REQUEST, "자신에게 추천서를 작성할 수 없습니다.", LogLevel.INFO),
    NOT_COWORKER("RC002", HttpStatus.BAD_REQUEST, "동료 관계인 사용자에게만 추천서를 작성할 수 있습니다.", LogLevel.INFO),
    ALREADY_EXISTS("RC003", HttpStatus.CONFLICT, "이미 추천서를 작성한 사용자입니다.", LogLevel.INFO);

    private final String code;
    private final HttpStatus status;
    private final String message;
    private final LogLevel logLevel;
}
