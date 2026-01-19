package so.morton.api.support.auth;

import com.fasterxml.jackson.databind.ObjectMapper;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import lombok.NonNull;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Qualifier;
import org.springframework.security.core.Authentication;
import org.springframework.security.web.authentication.AuthenticationSuccessHandler;
import org.springframework.stereotype.Component;

import java.io.IOException;
import java.util.HashMap;
import java.util.Map;

import static lombok.AccessLevel.PROTECTED;

/**
 * Refresh access token
 */
@Slf4j
@Component
@Qualifier("RefreshTokenAuthenticationSuccessHandler")
@RequiredArgsConstructor(access = PROTECTED)
public class RefreshTokenAuthenticationSuccessHandler implements AuthenticationSuccessHandler {

    private static final String ACCESS_TOKEN_KEY = "access_token";

    private final JwtProvider jwtProvider;

    @Override
    public void onAuthenticationSuccess(@NonNull HttpServletRequest request,@NonNull HttpServletResponse response,@NonNull Authentication authentication) throws IOException, ServletException {
        if (!(authentication instanceof JwtAuthenticationToken authToken)) {
            throw new AuthenticationTypeMismatchException("Authentication must of type" + JwtAuthenticationToken.class.getName());
        }

        if (authToken.isRefreshToken()) {
            if (log.isDebugEnabled()) {
                log.debug("Generate refresh token");
            }

            String accessToken = jwtProvider.generateAccessToken(authentication);

            Map<String, Object> responseBody = new HashMap<>();
            responseBody.put(ACCESS_TOKEN_KEY, accessToken);

            ObjectMapper mapper = new ObjectMapper();
            response.getWriter().write(mapper.writeValueAsString(responseBody));
        }
    }
}
