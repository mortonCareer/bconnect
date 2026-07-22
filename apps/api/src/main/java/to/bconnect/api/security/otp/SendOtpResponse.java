package to.bconnect.api.security.otp;

import io.swagger.v3.oas.annotations.media.Schema;

import java.time.Instant;

public record SendOtpResponse(@Schema(requiredMode = Schema.RequiredMode.REQUIRED) Instant expiresAt) {}
