package to.bconnect.api.support.security.otp;

import org.springframework.security.authentication.AbstractAuthenticationToken;
import org.springframework.security.core.GrantedAuthority;
import org.springframework.util.Assert;

import java.util.Collection;
import java.util.Collections;

public class OtpAuthenticationToken extends AbstractAuthenticationToken {

    /**
     * phone or UserDetails
     */
    private final Object principal;

    /**
     * code
     */
    private Object credentials;

    public OtpAuthenticationToken(Object principal, Object credentials) {
        super(Collections.emptySet());
        this.principal = principal;
        this.credentials = credentials;
        super.setAuthenticated(false);
    }

    public OtpAuthenticationToken(Object principal, Object credentials,
                                  Collection<? extends GrantedAuthority> authorities) {
        super(authorities);
        this.principal = principal;
        this.credentials = credentials;
        super.setAuthenticated(true);
    }

    @Override
    public Object getCredentials() {
        return this.credentials;
    }

    @Override
    public Object getPrincipal() {
        return this.principal;
    }

    @Override
    public void setAuthenticated(boolean isAuthenticated) throws IllegalArgumentException {
        Assert.isTrue(!isAuthenticated,
                "Cannot set this token to trusted - use constructor which takes a GrantedAuthority list instead");
        super.setAuthenticated(false);
    }

    @Override
    public void eraseCredentials() {
        super.eraseCredentials();
        this.credentials = null;
    }
}
