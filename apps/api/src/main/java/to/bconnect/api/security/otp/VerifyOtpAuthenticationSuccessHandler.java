package to.bconnect.api.security.otp;

import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import lombok.NonNull;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import lombok.val;
import org.springframework.beans.factory.annotation.Qualifier;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.security.core.Authentication;
import org.springframework.security.web.authentication.AuthenticationSuccessHandler;
import org.springframework.stereotype.Component;
import to.bconnect.api.common.response.ApiResponse;
import to.bconnect.api.security.AuthUser;
import to.bconnect.api.security.AuthenticationTypeMismatchException;
import to.bconnect.api.security.jwt.JwtProvider;
import to.bconnect.api.security.jwt.CookieProvider;
import to.bconnect.api.security.session.SessionService;
import tools.jackson.databind.ObjectMapper;

import java.io.IOException;

import static lombok.AccessLevel.PROTECTED;

@Slf4j
@Component
@Qualifier("VerifyOtpAuthenticationSuccessHandler")
@RequiredArgsConstructor(access = PROTECTED)
public class VerifyOtpAuthenticationSuccessHandler implements AuthenticationSuccessHandler {

    private final ObjectMapper objectMapper;
    private final JwtProvider jwtProvider;
    private final CookieProvider cookieProvider;
    private final OtpService otpService;
    private final SessionService sessionService;

    @Override
    public void onAuthenticationSuccess(@NonNull HttpServletRequest request,
                                        @NonNull HttpServletResponse response,
                                        @NonNull Authentication authentication) throws IOException {
        if (!(authentication instanceof OtpAuthenticationToken authToken)) {
            throw new AuthenticationTypeMismatchException("Authentication must be of type " + OtpAuthenticationToken.class.getName());
        }

        response.setContentType(MediaType.APPLICATION_JSON_VALUE);

        if (authToken.getPrincipal() instanceof AuthUser user) {
            if (log.isDebugEnabled()) {
                log.debug("Generate access token and refresh token");
            }

            val accessToken = jwtProvider.generateAccessToken(authentication);
            val refreshToken = jwtProvider.generateRefreshToken(authentication.getName());

            val agent = request.getHeader("User-Agent");
            val ip = request.getRemoteAddr();
            sessionService.login(user.getUsername(), agent, ip, refreshToken);
            val cookie = cookieProvider.create(refreshToken).toString();
            response.addHeader(HttpHeaders.SET_COOKIE, cookie);
            val data = new VerifyOtpLoginResponse(accessToken);

            response.getWriter().write(objectMapper.writeValueAsString(ApiResponse.success(data)));
        } else {
            val phone = (String) authToken.getPrincipal();
            if (log.isDebugEnabled()) {
                log.debug("Unregistered phone: {}, signup required", phone);
            }

            val signupToken = otpService.generateToken(phone);

            val data = new VerifyOtpSignupResponse(signupToken);
            response.getWriter().write(objectMapper.writeValueAsString(ApiResponse.success(data)));
        }
    }
}
