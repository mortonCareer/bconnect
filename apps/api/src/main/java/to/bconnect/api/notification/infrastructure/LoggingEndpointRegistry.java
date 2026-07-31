package to.bconnect.api.notification.infrastructure;

import lombok.extern.slf4j.Slf4j;
import lombok.val;
import org.springframework.context.annotation.Profile;
import org.springframework.stereotype.Component;
import to.bconnect.api.notification.domain.push.PushEndpointRegistry;

@Slf4j
@Component
@Profile({"local", "test"})
public class LoggingEndpointRegistry implements PushEndpointRegistry {

    @Override
    public String ensure(String token) {
        val endpoint = "arn:aws:sns:local:000000000000:endpoint/GCM/fake/" + Integer.toHexString(token.hashCode());
        log.info("SNS endpoint ensured (fake). endpoint={}", endpoint);
        return endpoint;
    }

    @Override
    public void delete(String endpoint) {
        log.info("SNS endpoint delete skipped (fake). endpoint={}", endpoint);
    }
}
