package so.morton.api.support;

import lombok.Getter;

@Getter
public class CodeException extends RuntimeException{
    private final ExceptionCode exceptionCode;

    public CodeException(ExceptionCode exceptionCode) {
        super(exceptionCode.getMessage());
        this.exceptionCode = exceptionCode;
    }
}
