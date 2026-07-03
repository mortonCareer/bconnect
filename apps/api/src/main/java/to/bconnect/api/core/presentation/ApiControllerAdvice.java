package to.bconnect.api.core.presentation;

import lombok.val;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.http.ResponseEntity;
import org.springframework.web.HttpMediaTypeNotSupportedException;
import org.springframework.web.bind.MethodArgumentNotValidException;
import org.springframework.web.bind.MissingServletRequestParameterException;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;
import org.springframework.web.method.annotation.MethodArgumentTypeMismatchException;
import org.springframework.web.servlet.resource.NoResourceFoundException;
import to.bconnect.api.common.CodeException;
import to.bconnect.api.common.CommonExceptionCode;
import to.bconnect.api.common.response.ApiResponse;

@RestControllerAdvice
public class ApiControllerAdvice {

    private final Logger log = LoggerFactory.getLogger(getClass());

    @ExceptionHandler(MethodArgumentNotValidException.class)
    public ResponseEntity<ApiResponse<Void>> handleMethodArgumentNotValid(MethodArgumentNotValidException e) {
        log.info("Validation failed: {}", e.getMessage());
        return ResponseEntity
                .status(CommonExceptionCode.NOT_VALID.getStatus())
                .body(ApiResponse.error(CommonExceptionCode.NOT_VALID));
    }

    @ExceptionHandler(MethodArgumentTypeMismatchException.class)
    public ResponseEntity<ApiResponse<Void>> handleTypeMismatch(MethodArgumentTypeMismatchException e) {
        log.info("Type mismatch: {}", e.getMessage());
        return ResponseEntity
                .status(CommonExceptionCode.TYPE_MISMATCH.getStatus())
                .body(ApiResponse.error(CommonExceptionCode.TYPE_MISMATCH));
    }

    @ExceptionHandler(MissingServletRequestParameterException.class)
    public ResponseEntity<ApiResponse<Void>> handleMissingParameter(MissingServletRequestParameterException e) {
        log.info("Missing parameter: {}", e.getMessage());
        return ResponseEntity
                .status(CommonExceptionCode.MISSING_PARAMETER.getStatus())
                .body(ApiResponse.error(CommonExceptionCode.MISSING_PARAMETER));
    }

    @ExceptionHandler(HttpMediaTypeNotSupportedException.class)
    public ResponseEntity<ApiResponse<Void>> handleUnsupportedMediaType(HttpMediaTypeNotSupportedException e) {
        log.warn("Unsupported media type: {}", e.getMessage());
        return ResponseEntity
                .status(CommonExceptionCode.UNSUPPORTED_MEDIA_TYPE.getStatus())
                .body(ApiResponse.error(CommonExceptionCode.UNSUPPORTED_MEDIA_TYPE));
    }

    @ExceptionHandler(CodeException.class)
    public ResponseEntity<ApiResponse<Void>> handleCodeException(CodeException e) {
        val logLevel = e.getExceptionCode().getLogLevel();
        switch (logLevel) {
            case ERROR -> log.error("CodeException : {}", e.getMessage(), e);
            case WARN -> log.warn("CodeException : {}", e.getMessage(), e);
            case INFO -> log.info("CodeException : {}", e.getMessage());
        }

        return ResponseEntity
                .status(e.getExceptionCode().getStatus())
                .body(ApiResponse.error(e.getExceptionCode()));
    }

    @ExceptionHandler(NoResourceFoundException.class)
    public ResponseEntity<ApiResponse<Void>> handleNotFound(NoResourceFoundException e) {
        return ResponseEntity
                .status(CommonExceptionCode.PATH_NOT_FOUND.getStatus())
                .body(ApiResponse.error(CommonExceptionCode.PATH_NOT_FOUND));
    }

    @ExceptionHandler(Exception.class)
    public ResponseEntity<ApiResponse<Void>> handleException(Exception e) {
        log.error("Exception : {}", e.getMessage(), e);

        return ResponseEntity
                .status(CommonExceptionCode.INTERNAL_SERVER_ERROR.getStatus())
                .body(ApiResponse.error(CommonExceptionCode.INTERNAL_SERVER_ERROR));
    }
}
