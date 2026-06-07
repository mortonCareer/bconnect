package to.bconnect.api.security.otp;

public record VerifyOtpLoginResponse(
        boolean registered,
        String accessToken,
        String refreshToken
) {
    public VerifyOtpLoginResponse(String accessToken, String refreshToken) {
        this(true, accessToken, refreshToken);
    }
}
