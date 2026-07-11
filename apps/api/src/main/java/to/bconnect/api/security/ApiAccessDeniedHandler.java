package to.bconnect.api.security;

import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import lombok.NonNull;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Qualifier;
import org.springframework.http.MediaType;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.security.web.access.AccessDeniedHandler;
import org.springframework.stereotype.Component;
import to.bconnect.api.common.CommonExceptionCode;
import to.bconnect.api.common.response.ApiResponse;
import tools.jackson.databind.ObjectMapper;

import java.io.IOException;

import static lombok.AccessLevel.PROTECTED;

@Slf4j
@Component
@Qualifier("ApiAccessDeniedHandler")
@RequiredArgsConstructor(access = PROTECTED)
public class ApiAccessDeniedHandler implements AccessDeniedHandler {

    private final ObjectMapper objectMapper;

    @Override
    public void handle(@NonNull HttpServletRequest request,
                       @NonNull HttpServletResponse response,
                       @NonNull AccessDeniedException accessDeniedException) throws IOException {
        log.warn("Access denied: {} {}", request.getMethod(), request.getRequestURI());
        response.setStatus(CommonExceptionCode.FORBIDDEN.getStatus().value());
        response.setCharacterEncoding("UTF-8");
        response.setContentType(MediaType.APPLICATION_JSON_VALUE);
        response.getWriter().write(objectMapper.writeValueAsString(
                ApiResponse.error(CommonExceptionCode.FORBIDDEN)
        ));
    }
}
