package to.bconnect.api.security.signup;

import lombok.NonNull;
import lombok.RequiredArgsConstructor;
import lombok.val;
import org.springframework.security.authentication.AuthenticationProvider;
import org.springframework.security.authentication.AuthenticationServiceException;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.AuthenticationException;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.util.Assert;
import to.bconnect.api.common.CodeException;

import java.util.List;
import java.util.Objects;

import static to.bconnect.api.security.AuthUser.ROLE_PREFIX;
import static to.bconnect.api.storage.member.Role.GUEST;

/**
 * Validate SignupTokenAuthenticationToken and generate authenticated token with phone principal
 */
@RequiredArgsConstructor
public class SignupTokenAuthenticationProvider implements AuthenticationProvider {

    private final SignupTokenService signupTokenService;

    @Override
    public Authentication authenticate(@NonNull Authentication authentication) throws AuthenticationException {
        Assert.isInstanceOf(SignupTokenAuthenticationToken.class, authentication,
                "Only SignupTokenAuthenticationToken is supported");

        val token = Objects.requireNonNull(authentication.getCredentials()).toString();

        try {
            val phone = signupTokenService.verify(token);
            return new SignupTokenAuthenticationToken(phone, token,
                    List.of(new SimpleGrantedAuthority(ROLE_PREFIX + GUEST)));
        } catch (CodeException ex) {
            throw new AuthenticationServiceException(ex.getMessage(), ex);
        }
    }

    @Override
    public boolean supports(@NonNull Class<?> authentication) {
        return SignupTokenAuthenticationToken.class.isAssignableFrom(authentication);
    }
}
