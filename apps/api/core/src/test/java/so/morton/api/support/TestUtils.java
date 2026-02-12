package so.morton.api.support;

import org.springframework.test.web.servlet.ResultMatcher;

import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

public final class TestUtils {

    private TestUtils() {
    }

    public static ResultMatcher successResponse() {
        return jsonPath("$.success").value(true);
    }

    public static <E extends Enum<E> & ExceptionCode> ResultMatcher errorResponse(E code) {
        return result -> {
            status().is(code.getStatus().value()).match(result);
            jsonPath("$.success").value(false).match(result);
            jsonPath("$.error").value(code.name()).match(result);
        };
    }
}
