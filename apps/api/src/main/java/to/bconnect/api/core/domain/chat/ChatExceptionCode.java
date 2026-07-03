package to.bconnect.api.core.domain.chat;

import lombok.AccessLevel;
import lombok.Getter;
import lombok.RequiredArgsConstructor;
import org.springframework.boot.logging.LogLevel;
import org.springframework.http.HttpStatus;
import to.bconnect.api.common.ExceptionCode;

@Getter
@RequiredArgsConstructor(access = AccessLevel.PRIVATE)
public enum ChatExceptionCode implements ExceptionCode {
    SELF_NOT_INCLUDED ("CH001", HttpStatus.BAD_REQUEST, "참여자 목록에 본인이 포함되어야 합니다.", LogLevel.INFO),
    INVALID_ATTACHMENT ("CH002", HttpStatus.BAD_REQUEST, "메시지 타입과 첨부가 일치하지 않습니다.", LogLevel.INFO);

    private final String code;
    private final HttpStatus status;
    private final String message;
    private final LogLevel logLevel;
}
