package to.bconnect.api.api.controller.v1;

import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import to.bconnect.api.api.controller.v1.request.SendCodeRequest;
import to.bconnect.api.api.controller.v1.response.SendOtpResponse;
import to.bconnect.api.support.security.otp.OtpService;
import to.bconnect.api.common.response.ApiResponse;

import java.time.LocalDateTime;

@RestController
@RequestMapping("/api/v1/auth/otp")
@RequiredArgsConstructor
public class OtpController {

    private final OtpService otpService;

    @PostMapping("/send")
    public ApiResponse<SendOtpResponse> send(@RequestBody @Valid SendCodeRequest request) {
        LocalDateTime expiresAt = otpService.sendCode(request.phone());
        return ApiResponse.success(new SendOtpResponse(expiresAt));
    }
}
