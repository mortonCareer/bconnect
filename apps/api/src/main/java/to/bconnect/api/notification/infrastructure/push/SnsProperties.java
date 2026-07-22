package to.bconnect.api.notification.infrastructure.push;

import org.springframework.boot.context.properties.ConfigurationProperties;

@ConfigurationProperties(prefix = "app.sns")
public record SnsProperties(
        String region,
        String platformApplicationArn
) {
    public boolean enabled() {
        return platformApplicationArn != null && !platformApplicationArn.isBlank();
    }
}
