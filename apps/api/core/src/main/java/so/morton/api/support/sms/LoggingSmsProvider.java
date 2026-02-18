package so.morton.api.support.sms;

import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Component;

/**
 * SMS provider that logs messages instead of sending
 */
@Slf4j
@Component
public class LoggingSmsProvider implements SmsProvider {

    @Override
    public void send(String phone, String message) {
        log.info("SMS to {}: {}", phone, message);
    }
}
