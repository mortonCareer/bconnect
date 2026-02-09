package so.morton.api.support.auth;

import com.fasterxml.jackson.databind.ObjectMapper;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import lombok.NonNull;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.security.web.authentication.AuthenticationSuccessHandler;
import org.springframework.security.web.authentication.SimpleUrlAuthenticationSuccessHandler;
import org.springframework.stereotype.Component;
import so.morton.api.support.auth.jwt.JwtProvider;

import java.io.IOException;
import java.util.HashMap;
import java.util.Map;

import static lombok.AccessLevel.PROTECTED;

@Slf4j
@Component
@RequiredArgsConstructor(access = PROTECTED)
public class UsernamePasswordAuthenticationSuccessHandler implements AuthenticationSuccessHandler {

    private static final String ACCESS_TOKEN_KEY = "access_token";
    private static final String REFRESH_TOKEN_KEY = "refresh_token";

    private final AuthenticationSuccessHandler delegate = new SimpleUrlAuthenticationSuccessHandler();
    
    private final JwtProvider jwtProvider;

    public void onAuthenticationSuccess(@NonNull HttpServletRequest request,@NonNull HttpServletResponse response,
                                        @NonNull Authentication authentication) throws IOException, ServletException {
        if (!(authentication instanceof UsernamePasswordAuthenticationToken)) {
            throw new AuthenticationTypeMismatchException("Authentication must of type" + UsernamePasswordAuthenticationToken.class.getName());
        }

        if (log.isDebugEnabled()) {
            log.debug("Generate access token and refresh token");
        }

        String accessToken = jwtProvider.generateAccessToken(authentication);
        String refreshToken = jwtProvider.generateRefreshToken(authentication.getName());

        Map<String, Object> responseBody = new HashMap<>();
        responseBody.put(ACCESS_TOKEN_KEY, accessToken);
        responseBody.put(REFRESH_TOKEN_KEY, refreshToken);

        ObjectMapper mapper = new ObjectMapper();
        response.getWriter().write(mapper.writeValueAsString(responseBody));
        this.delegate.onAuthenticationSuccess(request, response, authentication);
    }
}
