package to.bconnect.api.security.session;

import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import lombok.RequiredArgsConstructor;
import lombok.val;
import org.springframework.http.HttpHeaders;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.stereotype.Component;
import to.bconnect.api.security.AuthUser;
import to.bconnect.api.security.jwt.CookieProvider;
import to.bconnect.api.security.jwt.JwtProvider;
import to.bconnect.api.storage.member.Role;

import java.util.Set;

@Component
@RequiredArgsConstructor
public class SessionTokenIssuer {

    private final JwtProvider jwtProvider;
    private final CookieProvider cookieProvider;
    private final SessionService sessionService;

    public IssuedSession login(Long memberId, String username, Set<Role> roles,
                               HttpServletRequest request,
                               HttpServletResponse response) {
        val authUser = new AuthUser(memberId, username, roles);
        val authentication = new UsernamePasswordAuthenticationToken(authUser, null, authUser.getAuthorities());
        val accessToken = jwtProvider.generateAccessToken(authentication);
        val refreshToken = jwtProvider.generateRefreshToken(authentication.getName());

        sessionService.login(authentication.getName(), request.getHeader("User-Agent"), request.getRemoteAddr(), refreshToken);
        addRefreshTokenCookie(response, refreshToken);

        return new IssuedSession(accessToken);
    }

    private void addRefreshTokenCookie(HttpServletResponse response, String refreshToken) {
        response.addHeader(HttpHeaders.SET_COOKIE, cookieProvider.create(refreshToken).toString());
    }
}
