package so.morton.api.support.auth.jwt;

import lombok.NonNull;
import lombok.RequiredArgsConstructor;
import org.springframework.security.authentication.AuthenticationProvider;
import org.springframework.security.authentication.AuthenticationServiceException;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.AuthenticationException;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.core.userdetails.UserDetailsService;
import org.springframework.util.Assert;
import so.morton.api.support.CodeException;
import so.morton.api.support.auth.otp.SessionService;

import java.util.Objects;


/**
 * Validate JwtAuthenticationToken and generate authenticated JwtAuthenticationToken with type
 */
@RequiredArgsConstructor
public class JwtAuthenticationProvider implements AuthenticationProvider {

    private final UserDetailsService userDetailsService;
    private final SessionService sessionService;

    private final JwtProvider jwtProvider;

    @Override
    public Authentication authenticate(@NonNull Authentication authentication) throws AuthenticationException {
        Assert.isInstanceOf(JwtAuthenticationToken.class, authentication,
                "Only JwtTokenAuthenticationToken is supported");

        String token = Objects.requireNonNull(authentication.getCredentials()).toString();
        jwtProvider.validateToken(token);
        String username = jwtProvider.getUsername(token);
        JwtType type = JwtType.valueOf(jwtProvider.getTokenType(token).toUpperCase());
        UserDetails user = this.userDetailsService.loadUserByUsername(username);

        if (type == JwtType.REFRESH) {
            try {
                sessionService.verify(username, token);
            } catch (CodeException e) {
                throw new AuthenticationServiceException(e.getMessage(), e);
            }
        }

        return new JwtAuthenticationToken(user, token, type, user.getAuthorities());
    }

    @Override
    public boolean supports(@NonNull Class<?> authentication) {
        return (JwtAuthenticationToken.class.isAssignableFrom(authentication));
    }
}
