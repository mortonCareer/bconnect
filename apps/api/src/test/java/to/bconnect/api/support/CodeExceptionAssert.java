package to.bconnect.api.support;

import lombok.val;
import org.assertj.core.api.AbstractThrowableAssert;
import org.assertj.core.api.ThrowableAssert.ThrowingCallable;
import to.bconnect.api.common.CodeException;
import to.bconnect.api.common.ExceptionCode;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.catchThrowable;

public class CodeExceptionAssert
        extends AbstractThrowableAssert<CodeExceptionAssert, CodeException> {

    private CodeExceptionAssert(CodeException actual) {
        super(actual, CodeExceptionAssert.class);
    }

    public static CodeExceptionAssert assertCodeException(ThrowingCallable callable) {
        val throwable = catchThrowable(callable);
        assertThat(throwable).isInstanceOf(CodeException.class);
        return new CodeExceptionAssert((CodeException) throwable);
    }

    public CodeExceptionAssert hasExceptionCode(ExceptionCode expected) {
        isNotNull();
        val actualCode = actual.getExceptionCode();
        if (!actualCode.equals(expected)) {
            failWithMessage(
                    "Expected exception code <%s> but was <%s>",
                    expected, actualCode);
        }
        return this;
    }
}
