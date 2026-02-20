package so.morton.api.config;

import org.springframework.boot.context.properties.ConfigurationProperties;

import java.util.List;

@ConfigurationProperties(prefix = "app.cors")
public record CorsProperties(
    List<String> allowedOrigins,
    List<String> allowedOriginPatterns
) {
    public CorsProperties {
        if (allowedOrigins == null) allowedOrigins = List.of("http://localhost:3000");
        if (allowedOriginPatterns == null) allowedOriginPatterns = List.of();
    }
}