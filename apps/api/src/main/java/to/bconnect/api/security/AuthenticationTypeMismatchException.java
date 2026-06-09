package to.bconnect.api.security;

import org.springframework.security.core.AuthenticationException;

public class AuthenticationTypeMismatchException extends AuthenticationException {
    public AuthenticationTypeMismatchException(String message) {
        super(message);
    }
}
