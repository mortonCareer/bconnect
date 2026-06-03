package to.bconnect.api.api.controller.v1.response;

public record VerifyOtpSignupResponse(
        boolean registered,
        String signupToken
) {
    public VerifyOtpSignupResponse(String signupToken) {
        this(false, signupToken);
    }
}
