package to.bconnect.api.common;

import com.fasterxml.jackson.annotation.JsonFormat;
import com.fasterxml.jackson.annotation.JsonIgnore;
import org.springframework.http.HttpStatus;
import org.springframework.boot.logging.LogLevel;

@JsonFormat(shape = JsonFormat.Shape.OBJECT)
public interface ExceptionCode {
    String getCode();
    HttpStatus getStatus();
    String getMessage();
    @JsonIgnore LogLevel getLogLevel();
}
