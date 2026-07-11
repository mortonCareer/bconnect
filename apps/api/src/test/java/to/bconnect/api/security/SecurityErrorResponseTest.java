package to.bconnect.api.security;

import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.mock.web.MockHttpServletRequest;
import org.springframework.mock.web.MockHttpServletResponse;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.security.authentication.InsufficientAuthenticationException;
import tools.jackson.databind.ObjectMapper;
import tools.jackson.databind.json.JsonMapper;

import java.io.IOException;

import static org.assertj.core.api.Assertions.assertThat;

class SecurityErrorResponseTest {

    private final ObjectMapper objectMapper = JsonMapper.builder().build();

    @Test
    @DisplayName("미인증 요청은 401 UNAUTHORIZED(C009) envelope 로 응답한다")
    void entryPoint_returns401Envelope() throws IOException {
        var request = new MockHttpServletRequest("POST", "/api/v1/devices");
        var response = new MockHttpServletResponse();

        new ApiAuthenticationEntryPoint(objectMapper)
                .commence(request, response, new InsufficientAuthenticationException("no credentials"));

        assertThat(response.getStatus()).isEqualTo(401);
        assertThat(response.getContentType()).contains("application/json");
        assertThat(response.getContentAsString())
                .contains("\"success\":false")
                .contains("\"code\":\"C009\"")
                .contains("UNAUTHORIZED")
                .contains("인증이 필요합니다.");
    }

    @Test
    @DisplayName("권한 부족 요청은 403 FORBIDDEN(C004) envelope 로 응답한다")
    void accessDeniedHandler_returns403Envelope() throws IOException {
        var request = new MockHttpServletRequest("POST", "/api/v1/devices");
        var response = new MockHttpServletResponse();

        new ApiAccessDeniedHandler(objectMapper)
                .handle(request, response, new AccessDeniedException("denied"));

        assertThat(response.getStatus()).isEqualTo(403);
        assertThat(response.getContentType()).contains("application/json");
        assertThat(response.getContentAsString())
                .contains("\"success\":false")
                .contains("\"code\":\"C004\"")
                .contains("FORBIDDEN")
                .contains("리소스 접근 권한이 없습니다.");
    }
}
