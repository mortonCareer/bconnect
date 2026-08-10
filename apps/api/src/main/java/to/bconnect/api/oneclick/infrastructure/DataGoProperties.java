package to.bconnect.api.oneclick.infrastructure;

import jakarta.validation.constraints.NotBlank;
import org.springframework.boot.context.properties.ConfigurationProperties;
import org.springframework.validation.annotation.Validated;

@Validated
@ConfigurationProperties(prefix = "app.data-go")
public record DataGoProperties(
        @NotBlank(message = "app.data-go.service-key must not be blank")
        String serviceKey
) {}
