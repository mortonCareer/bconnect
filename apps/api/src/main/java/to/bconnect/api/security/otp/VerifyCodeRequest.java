package to.bconnect.api.security.otp;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;
import to.bconnect.api.storage.Regex;

public record VerifyCodeRequest(
        @NotBlank
        @Pattern(regexp = Regex.PHONE)
        String phone,

        @NotBlank
        @Pattern(regexp = Regex.OTP_CODE)
        String code
) {}
