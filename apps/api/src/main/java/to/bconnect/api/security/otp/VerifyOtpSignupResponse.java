package to.bconnect.api.security.otp;

public record VerifyOtpSignupResponse(
        boolean registered,
        String signupToken
) {
    public VerifyOtpSignupResponse(String signupToken) {
        this(false, signupToken);
    }
}
