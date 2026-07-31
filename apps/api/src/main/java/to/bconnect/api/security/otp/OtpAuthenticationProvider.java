package to.bconnect.api.security.otp;

import lombok.NonNull;
import lombok.RequiredArgsConstructor;
import lombok.val;
import org.springframework.security.authentication.AuthenticationProvider;
import org.springframework.security.authentication.AuthenticationServiceException;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.AuthenticationException;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.userdetails.UsernameNotFoundException;
import org.springframework.util.Assert;
import to.bconnect.api.common.CodeException;
import to.bconnect.api.security.AuthUserService;

import java.util.List;

import static to.bconnect.api.security.AuthUser.ROLE_PREFIX;
import static to.bconnect.api.storage.member.Role.SIGNUP;

@RequiredArgsConstructor
public class OtpAuthenticationProvider implements AuthenticationProvider {

    private final OtpService otpService;
    private final AuthUserService authUserService;

    @Override
    public Authentication authenticate(@NonNull Authentication authentication) throws AuthenticationException {
        Assert.isInstanceOf(OtpAuthenticationToken.class, authentication,
                "Only OtpAuthenticationToken is supported");

        val token = (OtpAuthenticationToken) authentication;
        val phone = (String) token.getPrincipal();
        val code = (String) token.getCredentials();

        try {
            otpService.verifyCode(phone, code);
        } catch (CodeException ex) {
            throw new AuthenticationServiceException(ex.getMessage(), ex);
        }

        try {
            val user = authUserService.loadUserByPhone(phone);
            return new OtpAuthenticationToken(user, null, user.getAuthorities());
        } catch (UsernameNotFoundException ex) {
            return new OtpAuthenticationToken(phone, null, List.of(new SimpleGrantedAuthority(ROLE_PREFIX + SIGNUP)));
        }
    }

    @Override
    public boolean supports(@NonNull Class<?> authentication) {
        return OtpAuthenticationToken.class.isAssignableFrom(authentication);
    }
}
