package so.morton.api.support.auth.jwt;

import jakarta.servlet.http.HttpServletRequest;
import org.springframework.http.HttpHeaders;
import org.springframework.util.StringUtils;
import so.morton.api.support.auth.BearerTokenNotValidException;

import java.util.regex.Matcher;
import java.util.regex.Pattern;

public class JwtUtils {

    public static String resolveBearerToken(HttpServletRequest request) {
        Pattern authorizationPattern = Pattern.compile("^Bearer (?<token>[a-zA-Z0-9-._~+/]+=*)$", Pattern.CASE_INSENSITIVE);
        String bearerTokenHeaderName = HttpHeaders.AUTHORIZATION;
        String authorization = request.getHeader(bearerTokenHeaderName);

        if (!StringUtils.startsWithIgnoreCase(authorization, "bearer")) {
            return null;
        }

        Matcher matcher = authorizationPattern.matcher(authorization);
        if (!matcher.matches()) {
            throw new BearerTokenNotValidException("Bearer token is malformed");
        }
        return matcher.group("token");
    }
}
