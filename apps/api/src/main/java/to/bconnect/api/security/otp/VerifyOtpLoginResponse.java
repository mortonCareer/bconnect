package to.bconnect.api.security.otp;

public record VerifyOtpLoginResponse(
        boolean registered,
        String accessToken
) {
    public VerifyOtpLoginResponse(String accessToken) {
        this(true, accessToken);
    }
}
