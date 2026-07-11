package to.bconnect.api.security;

import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import lombok.RequiredArgsConstructor;
import org.springframework.security.core.AuthenticationException;
import org.springframework.security.web.AuthenticationEntryPoint;
import tools.jackson.databind.ObjectMapper;
import to.bconnect.api.common.CommonExceptionCode;

import java.io.IOException;

/**
 * Return a 401 envelope when a request reaches a protected endpoint without valid authentication.
 */
@RequiredArgsConstructor
public class ApiAuthenticationEntryPoint implements AuthenticationEntryPoint {

    private final ObjectMapper objectMapper;

    @Override
    public void commence(HttpServletRequest request, HttpServletResponse response,
                         AuthenticationException authException) throws IOException {
        SecurityErrorResponseWriter.write(response, objectMapper, CommonExceptionCode.UNAUTHORIZED);
    }
}
