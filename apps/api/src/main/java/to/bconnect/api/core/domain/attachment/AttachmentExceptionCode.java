package to.bconnect.api.core.domain.attachment;

import lombok.AccessLevel;
import lombok.Getter;
import lombok.RequiredArgsConstructor;
import org.springframework.boot.logging.LogLevel;
import org.springframework.http.HttpStatus;
import to.bconnect.api.common.ExceptionCode;

@Getter
@RequiredArgsConstructor(access = AccessLevel.PRIVATE)
public enum AttachmentExceptionCode implements ExceptionCode {
    FILE_TOO_LARGE ("AT001", HttpStatus.CONTENT_TOO_LARGE, "파일 크기가 허용치를 초과했습니다.", LogLevel.INFO),
    TOO_MANY_FILES ("AT002", HttpStatus.BAD_REQUEST, "한 번에 업로드할 수 있는 파일 수를 초과했습니다.", LogLevel.INFO),
    NOT_FOUND ("AT003", HttpStatus.NOT_FOUND, "존재하지 않는 첨부파일입니다.", LogLevel.INFO),
    UNSUPPORTED_FILE_TYPE ("AT004", HttpStatus.UNSUPPORTED_MEDIA_TYPE, "허용되지 않는 파일 형식입니다.", LogLevel.WARN),
    NOT_COMPLETED ("AT005", HttpStatus.BAD_REQUEST, "업로드가 완료되지 않은 첨부파일입니다.", LogLevel.INFO),
    CONTEXT_MISMATCH ("AT006", HttpStatus.BAD_REQUEST, "첨부파일의 업로드 컨텍스트가 일치하지 않습니다.", LogLevel.WARN);

    private final String code;
    private final HttpStatus status;
    private final String message;
    private final LogLevel logLevel;
}
