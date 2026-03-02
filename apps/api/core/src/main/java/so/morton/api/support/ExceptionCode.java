package so.morton.api.support;

import org.springframework.http.HttpStatus;
import org.springframework.boot.logging.LogLevel;

public interface ExceptionCode {
    String getCode();
    HttpStatus getStatus();
    String getMessage();
    LogLevel getLogLevel();
}
