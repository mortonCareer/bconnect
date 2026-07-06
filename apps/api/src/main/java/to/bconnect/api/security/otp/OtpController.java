package to.bconnect.api.security.otp;

import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import lombok.val;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import to.bconnect.api.common.response.ApiResponse;

@RestController
@RequestMapping("/api/v1/auth/otp")
@RequiredArgsConstructor
public class OtpController {

    private final OtpService otpService;

    @PostMapping("/send")
    public ApiResponse<SendOtpResponse> send(@RequestBody @Valid SendCodeRequest request) {
        val otp = otpService.sendCode(request.phone());

        return ApiResponse.success(new SendOtpResponse(otp.expiredAt()));
    }
}
