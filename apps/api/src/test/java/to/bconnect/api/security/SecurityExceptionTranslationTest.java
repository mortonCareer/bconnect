package to.bconnect.api.security;

import jakarta.servlet.FilterChain;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.mock.web.MockHttpServletRequest;
import org.springframework.mock.web.MockHttpServletResponse;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.security.authentication.AnonymousAuthenticationToken;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.authority.AuthorityUtils;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.web.access.ExceptionTranslationFilter;
import tools.jackson.databind.ObjectMapper;
import tools.jackson.databind.json.JsonMapper;

import static org.assertj.core.api.Assertions.assertThat;

/**
 * 보호된 엔드포인트(anyRequest().authenticated()) 접근 시 인가 거부가
 * ExceptionTranslationFilter 를 통해 401(미인증) / 403(권한부족) 으로 분기되는지 검증한다.
 * 커스텀 EntryPoint 부재로 미인증까지 403(Http403ForbiddenEntryPoint) 으로 마스킹되던 회귀를 방지한다.
 */
@DisplayName("보호 엔드포인트 인가 거부: 미인증→401, 권한부족→403")
class SecurityExceptionTranslationTest {

    private final ObjectMapper objectMapper = JsonMapper.builder().build();

    private final ExceptionTranslationFilter filter = buildFilter();

    private ExceptionTranslationFilter buildFilter() {
        var exceptionTranslationFilter = new ExceptionTranslationFilter(new ApiAuthenticationEntryPoint(objectMapper));
        exceptionTranslationFilter.setAccessDeniedHandler(new ApiAccessDeniedHandler(objectMapper));
        return exceptionTranslationFilter;
    }

    @AfterEach
    void clearContext() {
        SecurityContextHolder.clearContext();
    }

    @Test
    @DisplayName("미인증(익명) 요청이 인가 거부되면 401 UNAUTHORIZED(C009) 로 응답한다")
    void anonymousRequest_denied_returns401() throws Exception {
        SecurityContextHolder.getContext().setAuthentication(
                new AnonymousAuthenticationToken("key", "anonymousUser",
                        AuthorityUtils.createAuthorityList("ROLE_ANONYMOUS")));
        var request = new MockHttpServletRequest("POST", "/api/v1/devices");
        var response = new MockHttpServletResponse();

        filter.doFilter(request, response, accessDeniedChain());

        assertThat(response.getStatus()).isEqualTo(401);
        assertThat(response.getContentType()).contains("application/json");
        assertThat(response.getContentAsString())
                .contains("\"success\":false")
                .contains("\"code\":\"C009\"")
                .contains("UNAUTHORIZED");
    }

    @Test
    @DisplayName("인증됐지만 권한이 부족한 요청은 403 FORBIDDEN(C004) 로 응답한다")
    void authenticatedRequest_denied_returns403() throws Exception {
        SecurityContextHolder.getContext().setAuthentication(
                new UsernamePasswordAuthenticationToken("user", "n/a",
                        AuthorityUtils.createAuthorityList("ROLE_CAREER")));
        var request = new MockHttpServletRequest("POST", "/api/v1/devices");
        var response = new MockHttpServletResponse();

        filter.doFilter(request, response, accessDeniedChain());

        assertThat(response.getStatus()).isEqualTo(403);
        assertThat(response.getContentType()).contains("application/json");
        assertThat(response.getContentAsString())
                .contains("\"success\":false")
                .contains("\"code\":\"C004\"")
                .contains("FORBIDDEN");
    }

    private FilterChain accessDeniedChain() {
        return (req, res) -> {
            throw new AccessDeniedException("access denied");
        };
    }
}
