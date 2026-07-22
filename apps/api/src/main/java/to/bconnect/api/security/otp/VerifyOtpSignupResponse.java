package to.bconnect.api.security.otp;

import io.swagger.v3.oas.annotations.media.Schema;

public record VerifyOtpSignupResponse(
        @Schema(requiredMode = Schema.RequiredMode.REQUIRED) boolean registered,
        @Schema(requiredMode = Schema.RequiredMode.REQUIRED) String signupToken
) {
    public VerifyOtpSignupResponse(String signupToken) {
        this(false, signupToken);
    }
}
