package so.morton.api.api.controller.v1;

import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import so.morton.api.api.controller.v1.request.SendOtpRequest;
import so.morton.api.support.auth.otp.OtpService;
import so.morton.api.support.response.ApiResponse;

@RestController
@RequestMapping("/api/v1/auth/otp")
@RequiredArgsConstructor
public class OtpController {

    private final OtpService otpService;

    @PostMapping("/send")
    public ApiResponse<Void> sendOtp(@RequestBody @Valid SendOtpRequest request) {
        otpService.send(request.phone());
        return ApiResponse.success(null);
    }
}
