package so.morton.api.support.auth;

import org.springframework.security.core.AuthenticationException;

public class BearerTokenNotValidException extends AuthenticationException {
    public BearerTokenNotValidException(String message) {
        super(message);
    }
}
