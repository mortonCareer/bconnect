package to.bconnect.api.common;

import lombok.Getter;

@Getter
public class CodeException extends RuntimeException {
    private final ExceptionCode exceptionCode;

    public CodeException(ExceptionCode exceptionCode) {
        super(exceptionCode.getMessage());
        this.exceptionCode = exceptionCode;
    }

    public CodeException(ExceptionCode exceptionCode, Throwable cause) {
        super(exceptionCode.getMessage(), cause);
        this.exceptionCode = exceptionCode;
    }
}
