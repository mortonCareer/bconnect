package to.bconnect.api.security;

import jakarta.servlet.http.HttpServletResponse;
import org.springframework.http.MediaType;
import tools.jackson.databind.ObjectMapper;
import to.bconnect.api.common.ExceptionCode;
import to.bconnect.api.common.response.ApiResponse;

import java.io.IOException;
import java.nio.charset.StandardCharsets;

/**
 * Write an ApiResponse error envelope for security filter-chain failures,
 * which are handled before the DispatcherServlet and thus out of reach of @RestControllerAdvice.
 */
public final class SecurityErrorResponseWriter {

    private SecurityErrorResponseWriter() {
    }

    public static void write(HttpServletResponse response, ObjectMapper objectMapper, ExceptionCode code) throws IOException {
        response.setStatus(code.getStatus().value());
        response.setContentType(MediaType.APPLICATION_JSON_VALUE);
        response.setCharacterEncoding(StandardCharsets.UTF_8.name());
        objectMapper.writeValue(response.getWriter(), ApiResponse.error(code));
    }
}
