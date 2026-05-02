package so.morton.api.domain.chat;

import lombok.AccessLevel;
import lombok.Getter;
import lombok.RequiredArgsConstructor;
import org.springframework.boot.logging.LogLevel;
import org.springframework.http.HttpStatus;
import so.morton.api.support.ExceptionCode;

@Getter
@RequiredArgsConstructor(access = AccessLevel.PRIVATE)
public enum ChatExceptionCode implements ExceptionCode {
    CHAT_NOT_FOUND    ("CH001", HttpStatus.NOT_FOUND,   "채팅방을 찾을 수 없습니다.",            LogLevel.INFO),
    NOT_PARTICIPANT   ("CH002", HttpStatus.FORBIDDEN,   "채팅방 참여자가 아닙니다.",              LogLevel.WARN),
    SELF_NOT_INCLUDED ("CH003", HttpStatus.BAD_REQUEST, "참여자 목록에 본인이 포함되어야 합니다.", LogLevel.INFO);

    private final String code;
    private final HttpStatus status;
    private final String message;
    private final LogLevel logLevel;
}
