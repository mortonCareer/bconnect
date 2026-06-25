package to.bconnect.api.support.s3;

import jakarta.validation.constraints.NotBlank;
import org.springframework.boot.context.properties.ConfigurationProperties;
import org.springframework.validation.annotation.Validated;

@Validated
@ConfigurationProperties(prefix = "app.s3")
public record S3Properties(
    @NotBlank(message = "app.s3.region must not be blank")
    String region,
    @NotBlank(message = "app.s3.bucket must not be blank")
    String bucket
) {}
