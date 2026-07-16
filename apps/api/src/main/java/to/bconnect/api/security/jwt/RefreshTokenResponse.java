package to.bconnect.api.security.jwt;

import io.swagger.v3.oas.annotations.media.Schema;

public record RefreshTokenResponse(@Schema(requiredMode = Schema.RequiredMode.REQUIRED) String accessToken) {}
