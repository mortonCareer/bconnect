package to.bconnect.api.security.otp;

import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import lombok.NonNull;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import lombok.val;
import org.springframework.beans.factory.annotation.Qualifier;
import org.springframework.http.MediaType;
import org.springframework.security.core.Authentication;
import org.springframework.security.web.authentication.AuthenticationSuccessHandler;
import org.springframework.stereotype.Component;
import to.bconnect.api.common.response.ApiResponse;
import to.bconnect.api.security.AuthUser;
import to.bconnect.api.security.AuthenticationTypeMismatchException;
import to.bconnect.api.security.session.SessionTokenIssuer;
import to.bconnect.api.security.signup.SignupTokenService;
import tools.jackson.databind.ObjectMapper;

import java.io.IOException;

import static lombok.AccessLevel.PROTECTED;

@Slf4j
@Component
@Qualifier("VerifyOtpAuthenticationSuccessHandler")
@RequiredArgsConstructor(access = PROTECTED)
public class VerifyOtpAuthenticationSuccessHandler implements AuthenticationSuccessHandler {

    private final ObjectMapper objectMapper;
    private final SignupTokenService signupTokenService;
    private final SessionTokenIssuer sessionTokenIssuer;

    @Override
    public void onAuthenticationSuccess(@NonNull HttpServletRequest request,
                                        @NonNull HttpServletResponse response,
                                        @NonNull Authentication authentication) throws IOException {
        if (!(authentication instanceof OtpAuthenticationToken authToken)) {
            throw new AuthenticationTypeMismatchException("Authentication must be of type " + OtpAuthenticationToken.class.getName());
        }

        response.setContentType(MediaType.APPLICATION_JSON_VALUE);
        response.setCharacterEncoding("UTF-8");

        if (authToken.getPrincipal() instanceof AuthUser user) {
            if (log.isDebugEnabled()) {
                log.debug("Generate access token and refresh token");
            }

            val session = sessionTokenIssuer.login(authentication, request, response);
            val data = new VerifyOtpLoginResponse(session.accessToken());
            response.getWriter().write(objectMapper.writeValueAsString(ApiResponse.success(data)));
        } else {
            val phone = (String) authToken.getPrincipal();
            if (log.isDebugEnabled()) {
                log.debug("Unregistered phone: {}, signup required", phone);
            }

            val token = signupTokenService.generate(phone);
            val data = new VerifyOtpSignupResponse(token);
            response.getWriter().write(objectMapper.writeValueAsString(ApiResponse.success(data)));
        }
    }
}
