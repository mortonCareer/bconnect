package so.morton.api.api.controller.v1.response;

public record VerifyOtpLoginResponse(
        boolean registered,
        String accessToken,
        String refreshToken
) {
    public VerifyOtpLoginResponse(String accessToken, String refreshToken) {
        this(true, accessToken, refreshToken);
    }
}
