package so.morton.api.support.auth.jwt;

import lombok.NonNull;
import lombok.RequiredArgsConstructor;
import org.springframework.security.authentication.AuthenticationProvider;
import org.springframework.security.authentication.AuthenticationServiceException;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.AuthenticationException;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.util.Assert;
import so.morton.api.support.CodeException;
import so.morton.api.support.auth.UserService;
import so.morton.api.support.auth.otp.SessionService;

import java.util.Objects;


/**
 * Validate JwtAuthenticationToken and generate authenticated JwtAuthenticationToken with type
 */
@RequiredArgsConstructor
public class JwtAuthenticationProvider implements AuthenticationProvider {

    private final UserService userService;
    private final SessionService sessionService;

    private final JwtProvider jwtProvider;

    @Override
    public Authentication authenticate(@NonNull Authentication authentication) throws AuthenticationException {
        Assert.isInstanceOf(JwtAuthenticationToken.class, authentication,
                "Only JwtTokenAuthenticationToken is supported");

        String token = Objects.requireNonNull(authentication.getCredentials()).toString();
        jwtProvider.validateToken(token);
        Long memberId = jwtProvider.getMemberId(token);
        JwtType type = JwtType.valueOf(jwtProvider.getTokenType(token).toUpperCase());
        UserDetails user = this.userService.loadUserById(memberId);

        if (type == JwtType.REFRESH) {
            try {
                sessionService.verify(user.getUsername(), token);
            } catch (CodeException ex) {
                throw new AuthenticationServiceException(ex.getMessage(), ex);
            }
        }

        return new JwtAuthenticationToken(user, token, type, user.getAuthorities());
    }

    @Override
    public boolean supports(@NonNull Class<?> authentication) {
        return (JwtAuthenticationToken.class.isAssignableFrom(authentication));
    }
}
