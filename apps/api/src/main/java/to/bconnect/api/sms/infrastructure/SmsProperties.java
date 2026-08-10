package to.bconnect.api.sms.infrastructure;

import jakarta.validation.constraints.NotBlank;
import org.springframework.boot.context.properties.ConfigurationProperties;
import org.springframework.context.annotation.Profile;
import org.springframework.validation.annotation.Validated;

@Validated
@Profile({"prod", "dev"})
@ConfigurationProperties(prefix = "app.sms")
public record SmsProperties(
    @NotBlank(message = "app.sms.api-key must not be blank")
    String apiKey,
    @NotBlank(message = "app.sms.api-secret must not be blank")
    String apiSecret,
    @NotBlank(message = "app.sms.sender-number must not be blank")
    String senderNumber
) {}
