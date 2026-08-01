package to.bconnect.api.notification.infrastructure;

import jakarta.validation.constraints.NotBlank;
import org.springframework.boot.context.properties.ConfigurationProperties;
import org.springframework.validation.annotation.Validated;

@Validated
@ConfigurationProperties(prefix = "app.sns")
public record SnsProperties(
    @NotBlank(message = "app.sns.region must not be blank")
    String region,
    @NotBlank(message = "app.sns.platform-application-arn must not be blank")
    String platformApplicationArn
) {}
