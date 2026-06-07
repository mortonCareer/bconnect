package to.bconnect.api.security.otp;

import lombok.NonNull;
import lombok.RequiredArgsConstructor;
import org.springframework.security.authentication.AuthenticationProvider;
import org.springframework.security.authentication.AuthenticationServiceException;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.AuthenticationException;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.core.userdetails.UsernameNotFoundException;
import org.springframework.util.Assert;
import to.bconnect.api.common.CodeException;
import to.bconnect.api.security.UserService;

import java.util.List;

import static to.bconnect.api.core.storage.member.Role.GUEST;
import static to.bconnect.api.security.User.ROLE_PREFIX;

@RequiredArgsConstructor
public class OtpAuthenticationProvider implements AuthenticationProvider {

    private final OtpService otpService;
    private final UserService userService;

    @Override
    public Authentication authenticate(@NonNull Authentication authentication) throws AuthenticationException {
        Assert.isInstanceOf(OtpAuthenticationToken.class, authentication,
                "Only OtpAuthenticationToken is supported");

        OtpAuthenticationToken token = (OtpAuthenticationToken) authentication;
        String phone = (String) token.getPrincipal();
        String code = (String) token.getCredentials();
        
        if (code == null) {
            throw new IllegalStateException("OTP code is required for authentication");
        }
        
        try {
            otpService.verifyCode(phone, code);
        } catch (CodeException ex) {
            throw new AuthenticationServiceException("OTP verification failed", ex);
        }

        try {
            UserDetails user = userService.loadUserByPhone(phone);
            return new OtpAuthenticationToken(user, null, user.getAuthorities());
        } catch (UsernameNotFoundException ex) {
            return new OtpAuthenticationToken(phone, null, List.of(new SimpleGrantedAuthority(ROLE_PREFIX + GUEST)));
        }
    }

    @Override
    public boolean supports(@NonNull Class<?> authentication) {
        return OtpAuthenticationToken.class.isAssignableFrom(authentication);
    }
}
