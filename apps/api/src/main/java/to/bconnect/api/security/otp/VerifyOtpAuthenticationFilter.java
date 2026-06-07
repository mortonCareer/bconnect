package to.bconnect.api.security.otp;

import tools.jackson.databind.ObjectMapper;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.springframework.http.HttpMethod;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.AuthenticationServiceException;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.AuthenticationException;
import org.springframework.security.web.authentication.AbstractAuthenticationProcessingFilter;
import org.springframework.security.web.servlet.util.matcher.PathPatternRequestMatcher;
import org.springframework.security.web.util.matcher.RequestMatcher;

import java.io.IOException;
import java.util.regex.Pattern;

import to.bconnect.api.storage.Regex;

/**
 * OTP 검증 요청 처리 필터
 * - POST /api/v1/auth/otp/verify
 *
 * @see org.springframework.security.web.authentication.UsernamePasswordAuthenticationFilter
 */
public class VerifyOtpAuthenticationFilter extends AbstractAuthenticationProcessingFilter {

    private static final RequestMatcher DEFAULT_PATH_REQUEST_MATCHER = PathPatternRequestMatcher.withDefaults()
            .matcher(HttpMethod.POST, "/api/v1/auth/otp/verify");

    private static final Pattern PHONE_PATTERN = Pattern.compile(Regex.PHONE);
    private static final Pattern OTP_CODE_PATTERN = Pattern.compile(Regex.OTP_CODE);

    private final ObjectMapper objectMapper;

    public VerifyOtpAuthenticationFilter(AuthenticationManager authenticationManager, ObjectMapper objectMapper) {
        super(DEFAULT_PATH_REQUEST_MATCHER, authenticationManager);
        this.objectMapper = objectMapper;
    }

    @Override
    public Authentication attemptAuthentication(HttpServletRequest request, HttpServletResponse response)
            throws AuthenticationException {
        try {
            VerifyCodeRequest body = objectMapper.readValue(request.getInputStream(), VerifyCodeRequest.class);
            String phone = body.phone() != null ? body.phone().trim() : "";
            String code = body.code() != null ? body.code().trim() : "";

            if (!PHONE_PATTERN.matcher(phone).matches()) throw new AuthenticationServiceException("유효하지 않은 전화번호 형식입니다");
            if (!OTP_CODE_PATTERN.matcher(code).matches()) throw new AuthenticationServiceException("유효하지 않은 인증코드 형식입니다");

            OtpAuthenticationToken authRequest = new OtpAuthenticationToken(phone, code);
            setDetails(request, authRequest);
            return this.getAuthenticationManager().authenticate(authRequest);
        } catch (IOException e) {
            throw new AuthenticationServiceException("인증 요청 본문 파싱에 실패했습니다", e);
        }
    }

    protected void setDetails(HttpServletRequest request, OtpAuthenticationToken authRequest) {
        authRequest.setDetails(this.authenticationDetailsSource.buildDetails(request));
    }
}
