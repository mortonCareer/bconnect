package to.bconnect.api.security;

import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import lombok.NonNull;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import lombok.val;
import org.springframework.http.MediaType;
import org.springframework.security.core.AuthenticationException;
import org.springframework.security.web.authentication.AuthenticationFailureHandler;
import org.springframework.stereotype.Component;
import to.bconnect.api.common.CodeException;
import to.bconnect.api.common.CommonExceptionCode;
import to.bconnect.api.common.ExceptionCode;
import to.bconnect.api.common.response.ApiResponse;
import tools.jackson.databind.ObjectMapper;

import java.io.IOException;

import static lombok.AccessLevel.PROTECTED;

@Slf4j
@Component
@RequiredArgsConstructor(access = PROTECTED)
public class ApiAuthenticationFailureHandler implements AuthenticationFailureHandler {

    private final ObjectMapper objectMapper;

    @Override
    public void onAuthenticationFailure(@NonNull HttpServletRequest request,
                                        @NonNull HttpServletResponse response,
                                        @NonNull AuthenticationException exception) throws IOException {
        val code = resolve(exception);
        switch (code.getLogLevel()) {
            case ERROR -> log.error("Authentication failed: {}", exception.getMessage(), exception);
            case WARN -> log.warn("Authentication failed: {}", exception.getMessage());
            case INFO -> log.info("Authentication failed: {}", exception.getMessage());
        }
        response.setStatus(code.getStatus().value());
        response.setCharacterEncoding("UTF-8");
        response.setContentType(MediaType.APPLICATION_JSON_VALUE);
        response.getWriter().write(objectMapper.writeValueAsString(ApiResponse.error(code)));
    }

    private ExceptionCode resolve(AuthenticationException exception) {
        if (exception.getCause() instanceof CodeException codeException) {
            return codeException.getExceptionCode();
        }
        return CommonExceptionCode.UNAUTHORIZED;
    }
}
