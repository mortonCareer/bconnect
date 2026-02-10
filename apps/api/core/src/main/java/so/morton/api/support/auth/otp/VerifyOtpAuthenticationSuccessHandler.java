package so.morton.api.support.auth.otp;

import com.fasterxml.jackson.databind.ObjectMapper;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import lombok.NonNull;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Qualifier;
import org.springframework.security.core.Authentication;
import org.springframework.http.MediaType;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.web.authentication.AuthenticationSuccessHandler;
import org.springframework.stereotype.Component;
import so.morton.api.support.auth.AuthenticationTypeMismatchException;
import so.morton.api.support.auth.jwt.JwtProvider;

import java.io.IOException;
import java.util.HashMap;
import java.util.Map;

import static lombok.AccessLevel.PROTECTED;

/**
 * OTP 검증 성공 핸들러
 * - AccessToken, RefreshToken 발급
 * - Session 저장
 *
 * @see so.morton.api.support.auth.UsernamePasswordAuthenticationSuccessHandler
 */
@Slf4j
@Component
@Qualifier("VerifyOtpAuthenticationSuccessHandler")
@RequiredArgsConstructor(access = PROTECTED)
public class VerifyOtpAuthenticationSuccessHandler implements AuthenticationSuccessHandler {

    private static final String ACCESS_TOKEN_KEY = "access_token";
    private static final String REFRESH_TOKEN_KEY = "refresh_token";

    private final JwtProvider jwtProvider;
    private final SessionService sessionService;

    @Override
    public void onAuthenticationSuccess(@NonNull HttpServletRequest request,
                                        @NonNull HttpServletResponse response,
                                        @NonNull Authentication authentication) throws IOException, ServletException {
        if (!(authentication instanceof OtpAuthenticationToken authToken)) {
            throw new AuthenticationTypeMismatchException("Authentication must be of type " + OtpAuthenticationToken.class.getName());
        }

        if (authToken.getPrincipal() instanceof UserDetails user) {
            if (log.isDebugEnabled()) {
                log.debug("Generate access token and refresh token");
            }

            String accessToken = jwtProvider.generateAccessToken(authentication);
            String refreshToken = jwtProvider.generateRefreshToken(authentication.getName());

            String agent = request.getHeader("User-Agent");
            String ip = request.getRemoteAddr();
            sessionService.upsert(user.getUsername(), agent, ip, refreshToken);

            Map<String, Object> responseBody = new HashMap<>();
            responseBody.put(ACCESS_TOKEN_KEY, accessToken);
            responseBody.put(REFRESH_TOKEN_KEY, refreshToken);

            response.setContentType(MediaType.APPLICATION_JSON_VALUE);
            ObjectMapper mapper = new ObjectMapper();
            response.getWriter().write(mapper.writeValueAsString(responseBody));
        } else {
            String phone = (String) authToken.getPrincipal();
            if (log.isDebugEnabled()) {
                log.debug("Unregistered phone: {}, signup required", phone);
            }

            response.sendRedirect("/signup");
        }
    }
}
