package to.bconnect.api.security.otp;

import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import to.bconnect.api.common.response.ApiResponse;
import to.bconnect.api.support.sms.SmsProvider;
import to.bconnect.api.support.sms.SmsTemplate;

@RestController
@RequestMapping("/api/v1/auth/otp")
@RequiredArgsConstructor
public class OtpController {

    private final OtpService otpService;
    private final SmsProvider smsProvider;

    @PostMapping("/send")
    public ApiResponse<SendOtpResponse> send(@RequestBody @Valid SendCodeRequest request) {
        Otp otp = otpService.sendCode(request.phone());
        smsProvider.send(request.phone(), String.format(SmsTemplate.OTP_CODE, otp.code()));

        return ApiResponse.success(new SendOtpResponse(otp.expiredAt()));
    }
}
