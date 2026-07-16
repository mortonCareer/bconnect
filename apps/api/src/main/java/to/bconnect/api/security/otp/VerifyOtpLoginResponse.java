package to.bconnect.api.security.otp;

import io.swagger.v3.oas.annotations.media.Schema;

public record VerifyOtpLoginResponse(
        @Schema(requiredMode = Schema.RequiredMode.REQUIRED) boolean registered,
        @Schema(requiredMode = Schema.RequiredMode.REQUIRED) String accessToken
) {
    public VerifyOtpLoginResponse(String accessToken) {
        this(true, accessToken);
    }
}
