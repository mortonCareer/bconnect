package to.bconnect.api.security.jwt;

import io.jsonwebtoken.JwtException;
import jakarta.servlet.FilterChain;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.mock.web.MockHttpServletRequest;
import org.springframework.mock.web.MockHttpServletResponse;
import org.springframework.security.authentication.AuthenticationManager;
import tools.jackson.databind.ObjectMapper;
import tools.jackson.databind.json.JsonMapper;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

class AccessTokenAuthenticationFilterTest {

    private final ObjectMapper objectMapper = JsonMapper.builder().build();

    @Test
    @DisplayName("무효 토큰(JwtException)은 401 INVALID_JWT_TOKEN(A009) envelope 로 응답하고 체인을 진행하지 않는다")
    void invalidToken_returns401Envelope_andStopsChain() throws Exception {
        AuthenticationManager authenticationManager = mock(AuthenticationManager.class);
        when(authenticationManager.authenticate(any())).thenThrow(new JwtException("Invalid token"));
        var filter = new AccessTokenAuthenticationFilter(authenticationManager, objectMapper);

        var request = new MockHttpServletRequest("POST", "/api/v1/devices");
        request.addHeader("Authorization", "Bearer bad.token.value");
        var response = new MockHttpServletResponse();
        var chain = mock(FilterChain.class);

        filter.doFilterInternal(request, response, chain);

        assertThat(response.getStatus()).isEqualTo(401);
        assertThat(response.getContentType()).contains("application/json");
        assertThat(response.getContentAsString())
                .contains("\"success\":false")
                .contains("\"code\":\"A009\"");
        verify(chain, never()).doFilter(any(), any());
    }

    @Test
    @DisplayName("토큰이 없으면 응답을 쓰지 않고 필터 체인을 통과시킨다")
    void noToken_passesThroughChain() throws Exception {
        AuthenticationManager authenticationManager = mock(AuthenticationManager.class);
        var filter = new AccessTokenAuthenticationFilter(authenticationManager, objectMapper);

        var request = new MockHttpServletRequest("POST", "/api/v1/devices");
        var response = new MockHttpServletResponse();
        var chain = mock(FilterChain.class);

        filter.doFilterInternal(request, response, chain);

        verify(chain).doFilter(request, response);
        assertThat(response.getContentAsString()).isEmpty();
    }
}
