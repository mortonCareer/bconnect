package so.morton.api.api.controller.v1;

import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import so.morton.api.api.controller.v1.request.SendOtpRequest;
import so.morton.api.api.controller.v1.response.SendOtpResponse;
import so.morton.api.support.auth.otp.OtpService;
import so.morton.api.support.response.ApiResponse;

import java.time.LocalDateTime;

@RestController
@RequestMapping("/api/v1/auth/otp")
@RequiredArgsConstructor
public class OtpController {

    private final OtpService otpService;

    @PostMapping("/send")
    public ApiResponse<SendOtpResponse> sendOtp(@RequestBody @Valid SendOtpRequest request) {
        LocalDateTime expiresAt = otpService.sendCode(request.phone());
        return ApiResponse.success(new SendOtpResponse(expiresAt));
    }
}
