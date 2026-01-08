package so.morton.api.config;

import jakarta.validation.constraints.NotBlank;
import org.springframework.boot.context.properties.ConfigurationProperties;
import org.springframework.validation.annotation.Validated;

@Validated
@ConfigurationProperties(prefix = "app")
public record AppProperties(
    @NotBlank(message = "DATABASE_URL is required")
    String databaseUrl,

    @NotBlank(message = "DATABASE_USERNAME is required")
    String databaseUsername,

    @NotBlank(message = "DATABASE_PASSWORD is required")
    String databasePassword
) {
}
