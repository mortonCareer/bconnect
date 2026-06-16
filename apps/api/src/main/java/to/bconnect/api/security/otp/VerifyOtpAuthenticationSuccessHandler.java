package to.bconnect.api.security.otp;

import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import lombok.NonNull;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Qualifier;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseCookie;
import org.springframework.security.core.Authentication;
import org.springframework.security.web.authentication.AuthenticationSuccessHandler;
import org.springframework.stereotype.Component;
import to.bconnect.api.security.AuthenticationTypeMismatchException;
import to.bconnect.api.security.AuthUser;
import to.bconnect.api.security.jwt.JwtProvider;
import to.bconnect.api.security.jwt.cookieProvider;
import to.bconnect.api.common.response.ApiResponse;
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
    private final cookieProvider cookieProvider;
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

            String accessToken = jwtProvider.generateAccessToken(authentication);
            String refreshToken = jwtProvider.generateRefreshToken(authentication.getName());

            String agent = request.getHeader("User-Agent");
            String ip = request.getRemoteAddr();
            sessionService.login(user.getUsername(), agent, ip, refreshToken);
            String cookie = cookieProvider.create(refreshToken).toString();
            response.addHeader(HttpHeaders.SET_COOKIE, cookie);
            var data = new VerifyOtpLoginResponse(accessToken);

            response.getWriter().write(objectMapper.writeValueAsString(ApiResponse.success(data)));
        } else {
            String phone = (String) authToken.getPrincipal();
            if (log.isDebugEnabled()) {
                log.debug("Unregistered phone: {}, signup required", phone);
            }

            String signupToken = otpService.generateToken(phone);

            var data = new VerifyOtpSignupResponse(signupToken);
            response.getWriter().write(objectMapper.writeValueAsString(ApiResponse.success(data)));
        }
    }
}
