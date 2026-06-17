package to.bconnect.api.security.jwt;

import lombok.NonNull;
import lombok.RequiredArgsConstructor;
import lombok.val;
import org.springframework.security.authentication.AuthenticationProvider;
import org.springframework.security.authentication.AuthenticationServiceException;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.AuthenticationException;
import org.springframework.security.core.userdetails.UserDetailsService;
import org.springframework.util.Assert;
import to.bconnect.api.common.CodeException;
import to.bconnect.api.security.session.SessionService;

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

        val token = Objects.requireNonNull(authentication.getCredentials()).toString();
        jwtProvider.validateToken(token);
        val username = jwtProvider.getUsername(token);
        val type = JwtType.valueOf(jwtProvider.getTokenType(token).toUpperCase());
        val user = this.userDetailsService.loadUserByUsername(username);

        if (type == JwtType.REFRESH) {
            try {
                sessionService.verify(username, token);
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
