package to.bconnect.api.security.session;

import lombok.val;
import org.junit.jupiter.api.Test;
import org.springframework.http.HttpHeaders;
import org.springframework.http.ResponseCookie;
import org.springframework.mock.web.MockHttpServletRequest;
import org.springframework.mock.web.MockHttpServletResponse;
import org.springframework.security.core.Authentication;
import to.bconnect.api.security.jwt.CookieProvider;
import to.bconnect.api.security.jwt.JwtProvider;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

class SessionTokenIssuerTest {

    private final JwtProvider jwtProvider = mock(JwtProvider.class);
    private final CookieProvider cookieProvider = mock(CookieProvider.class);
    private final SessionService sessionService = mock(SessionService.class);
    private final SessionTokenIssuer sessionTokenIssuer = new SessionTokenIssuer(jwtProvider, cookieProvider, sessionService);

    @Test
    void 로그인_세션을_발급한다() {
        val request = new MockHttpServletRequest();
        val response = new MockHttpServletResponse();
        request.addHeader("User-Agent", "agent");
        request.setRemoteAddr("127.0.0.1");

        when(jwtProvider.generateAccessToken(any(Authentication.class))).thenReturn("access-token");
        when(jwtProvider.generateRefreshToken("1")).thenReturn("refresh-token");
        when(cookieProvider.create("refresh-token"))
                .thenReturn(ResponseCookie.from("refreshToken", "refresh-token").build());

        val session = sessionTokenIssuer.login(1L, "user", "USER", request, response);

        assertThat(session.accessToken()).isEqualTo("access-token");
        assertThat(response.getHeader(HttpHeaders.SET_COOKIE)).isEqualTo("refreshToken=refresh-token");
        verify(sessionService).login("1", "agent", "127.0.0.1", "refresh-token");
    }

    @Test
    void 리프레시_토큰을_회전한다() {
        val authentication = mock(Authentication.class);
        val response = new MockHttpServletResponse();

        when(authentication.getName()).thenReturn("1");
        when(jwtProvider.generateAccessToken(authentication)).thenReturn("access-token");
        when(jwtProvider.generateRefreshToken("1")).thenReturn("refresh-token");
        when(cookieProvider.create("refresh-token"))
                .thenReturn(ResponseCookie.from("refreshToken", "refresh-token").build());

        val session = sessionTokenIssuer.rotate(authentication, response);

        assertThat(session.accessToken()).isEqualTo("access-token");
        assertThat(response.getHeader(HttpHeaders.SET_COOKIE)).isEqualTo("refreshToken=refresh-token");
        verify(sessionService).rotate("1", "refresh-token");
    }
}
