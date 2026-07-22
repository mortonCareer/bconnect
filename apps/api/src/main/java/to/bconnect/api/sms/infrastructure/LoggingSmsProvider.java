package to.bconnect.api.sms.infrastructure;

import lombok.extern.slf4j.Slf4j;
import org.springframework.context.annotation.Profile;
import org.springframework.stereotype.Component;
import to.bconnect.api.sms.SmsProvider;

/**
 * SMS provider that logs messages instead of sending
 */
@Slf4j
@Component
@Profile({"local", "test"})
public class LoggingSmsProvider implements SmsProvider {

    @Override
    public void send(String phone, String message) {
        log.info("SMS to {}: {}", phone, message);
    }
}
