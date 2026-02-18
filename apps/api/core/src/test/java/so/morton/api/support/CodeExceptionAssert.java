package so.morton.api.support;

import org.assertj.core.api.AbstractThrowableAssert;
import org.assertj.core.api.ThrowableAssert.ThrowingCallable;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.catchThrowable;

public class CodeExceptionAssert
        extends AbstractThrowableAssert<CodeExceptionAssert, CodeException> {

    private CodeExceptionAssert(CodeException actual) {
        super(actual, CodeExceptionAssert.class);
    }

    public static CodeExceptionAssert assertCodeException(ThrowingCallable callable) {
        Throwable throwable = catchThrowable(callable);
        assertThat(throwable).isInstanceOf(CodeException.class);
        return new CodeExceptionAssert((CodeException) throwable);
    }

    public CodeExceptionAssert hasExceptionCode(ExceptionCode expected) {
        isNotNull();
        ExceptionCode actualCode = actual.getExceptionCode();
        if (!actualCode.equals(expected)) {
            failWithMessage(
                    "Expected exception code <%s> but was <%s>",
                    expected, actualCode);
        }
        return this;
    }
}
