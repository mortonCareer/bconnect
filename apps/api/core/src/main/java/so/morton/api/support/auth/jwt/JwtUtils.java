package so.morton.api.support.auth.jwt;

import jakarta.servlet.http.Cookie;
import jakarta.servlet.http.HttpServletRequest;
import org.springframework.http.HttpHeaders;
import org.springframework.http.ResponseCookie;
import org.springframework.util.StringUtils;

public class JwtUtils {

    public static String resolveBearerToken(HttpServletRequest request) {
        String authorization = request.getHeader(HttpHeaders.AUTHORIZATION);
        if (!StringUtils.startsWithIgnoreCase(authorization, "bearer ")) return null;

        return authorization.substring(7).trim();
    }

    public static String resolveCookie(HttpServletRequest request, String name) {
        Cookie[] cookies = request.getCookies();
        if (cookies == null) return null;

        for (Cookie cookie : cookies)
            if (name.equals(cookie.getName()))
                return cookie.getValue();

        return null;
    }

    public static ResponseCookie deleteCookie(String name, String path) {
        return ResponseCookie.from(name, "")
                .path(path)
                .maxAge(0)
                .build();
    }
}
