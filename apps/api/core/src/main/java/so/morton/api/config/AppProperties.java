package so.morton.api.config;

import jakarta.validation.Valid;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotEmpty;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import org.springframework.boot.context.properties.ConfigurationProperties;
import org.springframework.validation.annotation.Validated;

import java.time.Duration;
import java.util.List;

@Validated
@ConfigurationProperties(prefix = "app")
public record AppProperties(
    @Valid @NotNull Cors cors,
    @Valid @NotNull Jwt jwt
) {
    public record Cors(
        @NotEmpty(message = "app.cors.allowed-origins must not be empty")
        List<String> allowedOrigins,
        List<String> allowedOriginPatterns
    ) {}

    public record Jwt(
        @NotBlank(message = "app.jwt.secret must not be blank")
        @Size(min = 32, message = "app.jwt.secret must be at least 32 characters (256-bit for HMAC-SHA256)")
        String secret,
        @NotNull(message = "app.jwt.access-token-expiration must not be null")
        Duration accessTokenExpiration,
        @NotNull(message = "app.jwt.refresh-token-expiration must not be null")
        Duration refreshTokenExpiration
    ) {}
}
