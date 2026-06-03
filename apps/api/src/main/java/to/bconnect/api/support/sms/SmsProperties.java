package to.bconnect.api.support.sms;

import org.springframework.boot.context.properties.ConfigurationProperties;

@ConfigurationProperties(prefix = "app.sms")
public record SmsProperties(
    String apiKey,
    String apiSecret,
    String senderNumber
) {}
