package to.bconnect.api.attachment.infrastructure.cloudfront;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import org.springframework.boot.context.properties.ConfigurationProperties;
import org.springframework.context.annotation.Profile;
import org.springframework.validation.annotation.Validated;

import java.time.Duration;

@Validated
@Profile({"prod", "dev"})
@ConfigurationProperties(prefix = "app.cloudfront")
public record CloudFrontProperties(
    @NotBlank(message = "app.cloudfront.domain must not be blank")
    String domain,
    @NotBlank(message = "app.cloudfront.key-pair-id must not be blank")
    String keyPairId,
    @NotBlank(message = "app.cloudfront.private-key must not be blank")
    String privateKey,
    @NotBlank(message = "app.cloudfront.cookie-domain must not be blank")
    String cookieDomain,
    @NotNull(message = "app.cloudfront.cookie-ttl must not be null")
    Duration cookieTtl
) {}
