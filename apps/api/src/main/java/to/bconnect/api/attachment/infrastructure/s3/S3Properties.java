package to.bconnect.api.attachment.infrastructure.s3;

import jakarta.validation.constraints.NotBlank;
import org.springframework.boot.context.properties.ConfigurationProperties;
import org.springframework.context.annotation.Profile;
import org.springframework.validation.annotation.Validated;

@Validated
@Profile({"prod", "dev"})
@ConfigurationProperties(prefix = "app.s3")
public record S3Properties(
    @NotBlank(message = "app.s3.region must not be blank")
    String region,
    @NotBlank(message = "app.s3.bucket must not be blank")
    String bucket
) {}
