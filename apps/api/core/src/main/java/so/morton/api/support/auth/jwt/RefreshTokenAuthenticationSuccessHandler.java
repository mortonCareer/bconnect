package so.morton.api.support.auth.jwt;

import tools.jackson.databind.ObjectMapper;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import lombok.NonNull;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Qualifier;
import org.springframework.http.MediaType;
import org.springframework.security.core.Authentication;
import org.springframework.security.web.authentication.AuthenticationSuccessHandler;
import org.springframework.stereotype.Component;
import so.morton.api.support.auth.AuthenticationTypeMismatchException;
import so.morton.api.support.response.ApiResponse;

import java.io.IOException;
import java.util.Map;

import static lombok.AccessLevel.PROTECTED;

@Slf4j
@Component
@Qualifier("RefreshTokenAuthenticationSuccessHandler")
@RequiredArgsConstructor(access = PROTECTED)
public class RefreshTokenAuthenticationSuccessHandler implements AuthenticationSuccessHandler {

    private static final String ACCESS_TOKEN_KEY = "access_token";

    private final ObjectMapper objectMapper;
    private final JwtProvider jwtProvider;

    @Override
    public void onAuthenticationSuccess(@NonNull HttpServletRequest request,
                                        @NonNull HttpServletResponse response,
                                        @NonNull Authentication authentication) throws IOException, ServletException {
        if (!(authentication instanceof JwtAuthenticationToken authToken)) {
            throw new AuthenticationTypeMismatchException("Authentication must be of type " + JwtAuthenticationToken.class.getName());
        }

        if (authToken.isRefreshToken()) {
            if (log.isDebugEnabled()) {
                log.debug("Generate access token from refresh token");
            }

            String accessToken = jwtProvider.generateAccessToken(authentication);

            response.setContentType(MediaType.APPLICATION_JSON_VALUE);
            response.getWriter().write(objectMapper.writeValueAsString(
                    ApiResponse.success(Map.of(ACCESS_TOKEN_KEY, accessToken))
            ));
        }
    }
}
