package so.morton.api.support.auth.jwt;

import jakarta.servlet.http.Cookie;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;

import java.time.Duration;

public class RefreshTokenCookieUtils {

    public static final String COOKIE_NAME = "refreshToken";

    public static void addRefreshTokenCookie(HttpServletResponse response, String refreshToken, Duration maxAge, boolean secure) {
        Cookie cookie = new Cookie(COOKIE_NAME, refreshToken);
        cookie.setHttpOnly(true);
        cookie.setSecure(secure);
        cookie.setPath("/");
        cookie.setMaxAge((int) maxAge.toSeconds());
        cookie.setAttribute("SameSite", secure ? "None" : "Lax");
        response.addCookie(cookie);
    }

    public static void clearRefreshTokenCookie(HttpServletResponse response, boolean secure) {
        Cookie cookie = new Cookie(COOKIE_NAME, "");
        cookie.setHttpOnly(true);
        cookie.setSecure(secure);
        cookie.setPath("/");
        cookie.setMaxAge(0);
        cookie.setAttribute("SameSite", secure ? "None" : "Lax");
        response.addCookie(cookie);
    }

    public static String resolveRefreshToken(HttpServletRequest request) {
        Cookie[] cookies = request.getCookies();
        if (cookies == null) return null;

        for (Cookie cookie : cookies) {
            if (COOKIE_NAME.equals(cookie.getName())) {
                return cookie.getValue();
            }
        }
        return null;
    }
}
