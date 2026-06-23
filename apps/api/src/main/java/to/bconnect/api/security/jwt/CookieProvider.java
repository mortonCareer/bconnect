package to.bconnect.api.security.jwt;

import org.springframework.http.ResponseCookie;
import org.springframework.stereotype.Component;
import to.bconnect.api.ApiConfigProps;

import java.time.Duration;

@Component
public class CookieProvider {

    private static final String REFRESH_TOKEN_COOKIE_NAME = "refreshToken";
    private static final String COOKIE_PATH = "/api/v1/auth";

    private final Duration refreshTokenExpiration;
    private final String cookieDomain;

    public CookieProvider(ApiConfigProps apiConfigProps) {
        this.refreshTokenExpiration = apiConfigProps.jwt().refreshTokenExpiration();
        this.cookieDomain = apiConfigProps.jwt().cookieDomain();
    }

    public ResponseCookie create(String refreshToken) {
        return base(REFRESH_TOKEN_COOKIE_NAME, refreshToken)
                .httpOnly(true)
                .secure(true)
                .sameSite("Strict")
                .maxAge(refreshTokenExpiration)
                .build();
    }

    public ResponseCookie delete() {
        return base(REFRESH_TOKEN_COOKIE_NAME, "")
                .maxAge(0)
                .build();
    }

    private ResponseCookie.ResponseCookieBuilder base(String name, String value) {
        ResponseCookie.ResponseCookieBuilder builder = ResponseCookie.from(name, value)
                .path(COOKIE_PATH);
        if (cookieDomain != null && !cookieDomain.isBlank())
            builder.domain(cookieDomain);
        return builder;
    }
}
