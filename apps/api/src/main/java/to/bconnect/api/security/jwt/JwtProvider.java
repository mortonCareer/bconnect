package to.bconnect.api.security.jwt;

import io.jsonwebtoken.Claims;
import io.jsonwebtoken.ExpiredJwtException;
import io.jsonwebtoken.JwtException;
import io.jsonwebtoken.Jwts;
import io.jsonwebtoken.security.Keys;
import lombok.extern.slf4j.Slf4j;
import lombok.val;
import to.bconnect.api.ApiConfigProps;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.GrantedAuthority;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.stereotype.Component;
import to.bconnect.api.security.AuthUserService;

import java.time.Duration;
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
public class JwtProvider {
    private static final String SCOPE_CLAIM_KEY = "scope";
    private static final String TOKEN_TYPE_CLAIM_KEY = "type";
    private static final String ACCESS_TOKEN_TYPE = "access";
    private static final String REFRESH_TOKEN_TYPE = "refresh";
    private static final String AUTHORITIES_DELIMITER = ",";
    private static final String AUTHORITY_PREFIX = "ROLE_";

    private final SecretKey secret;
    private final Duration accessTokenExpiration;
    private final Duration refreshTokenExpiration;
    private final AuthUserService authUserService;

    public JwtProvider(ApiConfigProps apiConfigProps, AuthUserService authUserService) {
        val properties = apiConfigProps.jwt();
        this.secret = Keys.hmacShaKeyFor(properties.secret().getBytes());
        this.accessTokenExpiration = properties.accessTokenExpiration();
        this.refreshTokenExpiration = properties.refreshTokenExpiration();
        this.authUserService = authUserService;
    }

    public String generateAccessToken(Authentication authentication) {
        val username = authentication.getName();
        val authorities = authentication.getAuthorities()
                .stream()
                .map(GrantedAuthority::getAuthority)
                .map(it -> it.substring(AUTHORITY_PREFIX.length()))
                .collect(Collectors.joining(AUTHORITIES_DELIMITER));

        val now = new Date();
        val expiration = new Date(now.getTime() + accessTokenExpiration.toMillis());

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
        val authorities = user.getAuthorities()
                .stream()
                .map(GrantedAuthority::getAuthority)
                .map(it -> it.substring(AUTHORITY_PREFIX.length()))
                .collect(Collectors.joining(AUTHORITIES_DELIMITER));

        val now = new Date();
        val expiration = new Date(now.getTime() + accessTokenExpiration.toMillis());

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
        val now = new Date();
        val expiration = new Date(now.getTime() + refreshTokenExpiration.toMillis());

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
            val username = getUsername(token);
            val user = authUserService.loadUserByUsername(username);
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
        val authorities = getClaims(token)
                .get(SCOPE_CLAIM_KEY, String.class)
                .split(AUTHORITIES_DELIMITER);

        val grantedAuthorities = new ArrayList<GrantedAuthority>();
        for (val authority : authorities) {
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