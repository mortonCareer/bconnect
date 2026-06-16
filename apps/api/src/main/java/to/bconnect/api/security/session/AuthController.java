package to.bconnect.api.security.session;

import jakarta.servlet.http.HttpServletResponse;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpHeaders;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import to.bconnect.api.common.response.ApiResponse;
import to.bconnect.api.security.jwt.cookieProvider;

@RestController
@RequestMapping("/api/v1/auth")
@RequiredArgsConstructor
public class AuthController {

    private final SessionService sessionService;
    private final cookieProvider cookieProvider;

    @PostMapping("/logout")
    public ApiResponse<Void> logout(Authentication authentication, HttpServletResponse response) {
        sessionService.logout(authentication.getName());
        response.addHeader(HttpHeaders.SET_COOKIE, cookieProvider.delete().toString());
        return ApiResponse.success(null);
    }
}
