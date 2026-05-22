package so.morton.api.support;

import com.fasterxml.jackson.annotation.JsonFormat;
import com.fasterxml.jackson.annotation.JsonIgnore;
import org.springframework.http.HttpStatus;
import org.springframework.boot.logging.LogLevel;

@JsonFormat(shape = JsonFormat.Shape.OBJECT)
public interface ExceptionCode {
    String getCode();
    @JsonIgnore HttpStatus getStatus();
    String getMessage();
    @JsonIgnore LogLevel getLogLevel();
}
