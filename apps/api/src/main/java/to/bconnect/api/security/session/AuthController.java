package to.bconnect.api.security.session;

import lombok.RequiredArgsConstructor;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import to.bconnect.api.common.response.ApiResponse;

@RestController
@RequestMapping("/api/v1/auth")
@RequiredArgsConstructor
public class AuthController {

    private final SessionService sessionService;

    @PostMapping("/logout")
    public ApiResponse<Void> logout(Authentication authentication) {
        sessionService.logout(authentication.getName());
        return ApiResponse.success(null);
    }
}
