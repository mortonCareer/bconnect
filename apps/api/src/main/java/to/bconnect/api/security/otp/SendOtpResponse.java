package to.bconnect.api.security.otp;

import java.time.OffsetDateTime;

public record SendOtpResponse(OffsetDateTime expiresAt) {}
