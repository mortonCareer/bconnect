package to.bconnect.api.security.signup;

import org.springframework.security.authentication.AbstractAuthenticationToken;
import org.springframework.security.core.GrantedAuthority;
import org.springframework.util.Assert;

import java.util.Collection;
import java.util.Collections;

public class SignupTokenAuthenticationToken extends AbstractAuthenticationToken {

    /**
     * phone
     */
    private final Object principal;

    /**
     * signup token
     */
    private Object credentials;

    public SignupTokenAuthenticationToken(Object credentials) {
        super(Collections.emptySet());
        this.principal = null;
        this.credentials = credentials;
        super.setAuthenticated(false);
    }

    public SignupTokenAuthenticationToken(Object principal, Object credentials,
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
