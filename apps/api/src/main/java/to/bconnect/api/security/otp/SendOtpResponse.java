package to.bconnect.api.security.otp;

import java.time.Instant;

public record SendOtpResponse(Instant expiresAt) {}
