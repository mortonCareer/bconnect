package to.bconnect.api;

import jakarta.validation.Valid;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotEmpty;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import org.springframework.boot.context.properties.ConfigurationProperties;
import org.springframework.validation.annotation.Validated;

import java.time.Duration;
import java.time.ZoneId;
import java.util.List;

@Validated
@ConfigurationProperties(prefix = "app")
public record ApiConfigProps(
    @Valid @NotNull Cors cors,
    @Valid @NotNull Jwt jwt,
    @Valid @NotNull Retention retention,
    @NotBlank(message = "app.timezone must not be blank") String timezone
) {

    public ZoneId zoneId() {
        return ZoneId.of(timezone);
    }

    public record Cors(
        @NotEmpty(message = "app.cors.allowed-origins must not be empty")
        List<String> allowedOrigins,
        @NotEmpty(message = "app.cors.allowed-origin-patterns must not be empty")
        List<String> allowedOriginPatterns
    ) {}

    public record Jwt(
        @NotBlank(message = "app.jwt.secret must not be blank")
        @Size(min = 32, message = "app.jwt.secret must be at least 32 characters (256-bit for HMAC-SHA256)")
        String secret,
        @NotNull(message = "app.jwt.access-token-expiration must not be null")
        Duration accessTokenExpiration,
        @NotNull(message = "app.jwt.refresh-token-expiration must not be null")
        Duration refreshTokenExpiration,
        @NotBlank(message = "app.jwt.cookie-domain must not be blank")
        String cookieDomain
    ) {}

    public record Retention(
        @NotNull(message = "app.retention.abuse must not be null")
        Duration abuse,
        @NotNull(message = "app.retention.transaction-party must not be null")
        Duration transactionParty
    ) {}
}
