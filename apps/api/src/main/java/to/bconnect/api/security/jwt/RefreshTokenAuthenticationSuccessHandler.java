package to.bconnect.api.security.jwt;

import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import lombok.NonNull;
import lombok.RequiredArgsConstructor;
import lombok.val;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Qualifier;
import org.springframework.http.MediaType;
import org.springframework.security.core.Authentication;
import org.springframework.security.web.authentication.AuthenticationSuccessHandler;
import org.springframework.stereotype.Component;
import to.bconnect.api.common.response.ApiResponse;
import to.bconnect.api.security.AuthenticationTypeMismatchException;
import to.bconnect.api.security.session.SessionTokenIssuer;
import tools.jackson.databind.ObjectMapper;

import java.io.IOException;

import static lombok.AccessLevel.PROTECTED;

@Slf4j
@Component
@Qualifier("RefreshTokenAuthenticationSuccessHandler")
@RequiredArgsConstructor(access = PROTECTED)
public class RefreshTokenAuthenticationSuccessHandler implements AuthenticationSuccessHandler {

    private final ObjectMapper objectMapper;
    private final SessionTokenIssuer sessionTokenIssuer;

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

            val session = sessionTokenIssuer.rotate(authentication, response);

            response.setCharacterEncoding("UTF-8");
            response.setContentType(MediaType.APPLICATION_JSON_VALUE);
            response.getWriter().write(objectMapper.writeValueAsString(
                    ApiResponse.success(new RefreshTokenResponse(session.accessToken()))
            ));
        }
    }
}
