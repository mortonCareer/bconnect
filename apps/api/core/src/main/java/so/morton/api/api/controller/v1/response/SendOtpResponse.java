package so.morton.api.api.controller.v1.response;

import java.time.LocalDateTime;

public record SendOtpResponse(LocalDateTime expiresAt) {}
