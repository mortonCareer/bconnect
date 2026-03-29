package so.morton.api.api.controller.v1.response;

public record VerifyOtpLoginResponse(
        boolean registered,
        String accessToken
) {
    public VerifyOtpLoginResponse(String accessToken) {
        this(true, accessToken);
    }
}
