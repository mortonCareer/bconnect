package so.morton.api.support.auth.jwt;

import io.jsonwebtoken.*;
import io.jsonwebtoken.security.Keys;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.GrantedAuthority;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.stereotype.Component;
import so.morton.api.support.auth.User;
import so.morton.api.support.auth.UserService;

import javax.crypto.SecretKey;
import java.util.ArrayList;
import java.util.Collection;
import java.util.Date;
import java.util.stream.Collectors;

import static io.jsonwebtoken.Jwts.SIG.HS256;

/**
 * Validate and generate JWT
 */
@Slf4j
@Component
// TODO: thread safe 판단 기준이 무엇인지
public class JwtProvider {
    private static final String SCOPE_CLAIM_KEY = "scope";
    private static final String TOKEN_TYPE_CLAIM_KEY = "type";
    private static final String ACCESS_TOKEN_TYPE = "access";
    private static final String REFRESH_TOKEN_TYPE = "refresh";
    private static final String AUTHORITIES_DELIMITER = ",";
    private static final String AUTHORITY_PREFIX = "ROLE_";

    private final SecretKey secret;
    private final long accessTokenExpiration;
    private final long refreshTokenExpiration;
    private final UserService userService;

    public JwtProvider(
            @Value("${jwt.secret}") String secret,
            @Value("${jwt.access-token-expiration:3600000}") long accessTokenExpiration,
            @Value("${jwt.refresh-token-expiration:604800000}") long refreshTokenExpiration,
            UserService userService) {
        this.secret = Keys.hmacShaKeyFor(secret.getBytes());
        this.accessTokenExpiration = accessTokenExpiration;
        this.refreshTokenExpiration = refreshTokenExpiration;
        this.userService = userService;
    }

    public String generateAccessToken(Authentication authentication) {
        String username = authentication.getName();
        String authorities = authentication.getAuthorities()
                .stream()
                .map(GrantedAuthority::getAuthority)
                .map(authority -> authority.substring(5))
                .collect(Collectors.joining(AUTHORITIES_DELIMITER));

        Date now = new Date();
        Date expiration = new Date(now.getTime() + accessTokenExpiration);

        return Jwts.builder()
                .subject(username)
                .claim(SCOPE_CLAIM_KEY, authorities)
                .claim(TOKEN_TYPE_CLAIM_KEY, ACCESS_TOKEN_TYPE)
                .issuedAt(now)
                .expiration(expiration)
                .signWith(secret, HS256)
                .compact();
    }

    public String generateAccessToken(UserDetails user) {
        String authorities = user.getAuthorities()
                .stream()
                .map(GrantedAuthority::getAuthority)
                .map(authority -> authority.substring(AUTHORITY_PREFIX.length()))
                .collect(Collectors.joining(AUTHORITIES_DELIMITER));

        Date now = new Date();
        Date expiration = new Date(now.getTime() + accessTokenExpiration);

        return Jwts.builder()
                .subject(user.getUsername())
                .claim(SCOPE_CLAIM_KEY, authorities)
                .claim(TOKEN_TYPE_CLAIM_KEY, ACCESS_TOKEN_TYPE)
                .issuedAt(now)
                .expiration(expiration)
                .signWith(secret, HS256)
                .compact();
    }

    public String generateRefreshToken(String username) {
        Date now = new Date();
        Date expiration = new Date(now.getTime() + refreshTokenExpiration);

        return Jwts.builder()
                .subject(username)
                .claim(TOKEN_TYPE_CLAIM_KEY, REFRESH_TOKEN_TYPE)
                .issuedAt(now)
                .expiration(expiration)
                .signWith(secret, HS256)
                .compact();
    }

    public String refreshAccessToken(String token) {
        validateToken(token);

        if (isRefreshToken(token)) {
            String username = getUsername(token);
            UserDetails user = userService.loadUserByUsername(username);
            return generateAccessToken(user);
        }

        throw new JwtException("Invalid refresh token");
    }

    public void validateToken(String token) {
        getClaims(token);
    }

    public String getUsername(String token) {
        return getClaims(token).getSubject();
    }

    public Collection<GrantedAuthority> getAuthorities(String token) {
        String[] authorities = getClaims(token)
                .get(SCOPE_CLAIM_KEY, String.class)
                .split(AUTHORITIES_DELIMITER);

        Collection<GrantedAuthority> grantedAuthorities = new ArrayList<>();
        for (String authority : authorities) {
            grantedAuthorities.add(new SimpleGrantedAuthority(AUTHORITY_PREFIX + authority));
        }
        return grantedAuthorities;
    }

    public String getTokenType(String token) {
        return getClaims(token).get(TOKEN_TYPE_CLAIM_KEY, String.class);
    }

    public Claims getClaims(String token) {
        try {
            return Jwts.parser()
                    .verifyWith(secret)
                    .build()
                    .parseSignedClaims(token)
                    .getPayload();
        } catch (ExpiredJwtException ex) {
            log.error("Expired token: {}", ex.getMessage());
            throw new JwtException("Expired token", ex);
        } catch (JwtException | IllegalArgumentException ex) {
            log.error("Invalid token: {}", ex.getMessage());
            throw new JwtException("Invalid token", ex);
        }
    }

    public boolean isAccessToken(String token) {
        return ACCESS_TOKEN_TYPE.equals(getTokenType(token));
    }

    public boolean isRefreshToken(String token) {
        return REFRESH_TOKEN_TYPE.equals(getTokenType(token));
    }
}