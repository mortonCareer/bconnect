package to.bconnect.api.security.otp;

public record OtpIssuedEvent(
        String phone,
        String code
) { }
