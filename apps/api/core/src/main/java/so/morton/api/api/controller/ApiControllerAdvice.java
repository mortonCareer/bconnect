package so.morton.api.api.controller;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.MethodArgumentNotValidException;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;
import so.morton.api.support.CodeException;
import so.morton.api.support.CommonExceptionCode;
import so.morton.api.support.response.ApiResponse;

@RestControllerAdvice
public class ApiControllerAdvice {

    private final Logger log = LoggerFactory.getLogger(getClass());

    @ExceptionHandler(MethodArgumentNotValidException.class)
    public ResponseEntity<ApiResponse<Void>> handleMethodArgumentNotValid(MethodArgumentNotValidException e) {
        log.warn("Validation failed: {}", e.getMessage());
        return ResponseEntity
                .status(CommonExceptionCode.NOT_VALID.getStatus())
                .body(ApiResponse.error(CommonExceptionCode.NOT_VALID));
    }

    @ExceptionHandler(CodeException.class)
    public ResponseEntity<ApiResponse<Void>> handleCodeException(CodeException e) {
        if (e.getExceptionCode().getStatus().is5xxServerError()) {
            log.error("CodeException : {}", e.getMessage(), e);
        } else {
            log.warn("CodeException : {}", e.getMessage(), e);
        }

        return ResponseEntity
                .status(e.getExceptionCode().getStatus())
                .body(ApiResponse.error(e.getExceptionCode()));
    }

    @ExceptionHandler(Exception.class)
    public ResponseEntity<ApiResponse<Void>> handleException(Exception e) {
        log.error("Exception : {}", e.getMessage(), e);

        return ResponseEntity
                .status(CommonExceptionCode.INTERNAL_SERVER_ERROR.getStatus())
                .body(ApiResponse.error(CommonExceptionCode.INTERNAL_SERVER_ERROR));
    }
}
