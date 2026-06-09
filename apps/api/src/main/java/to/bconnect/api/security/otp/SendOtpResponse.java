package to.bconnect.api.security.otp;

import java.time.LocalDateTime;

public record SendOtpResponse(LocalDateTime expiresAt) {}
