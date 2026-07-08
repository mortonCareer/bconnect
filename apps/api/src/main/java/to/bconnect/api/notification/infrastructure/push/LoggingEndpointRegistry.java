package to.bconnect.api.notification.infrastructure.push;

import lombok.extern.slf4j.Slf4j;
import org.springframework.context.annotation.Profile;
import org.springframework.stereotype.Component;
import to.bconnect.api.notification.domain.push.PushEndpointRegistry;

@Slf4j
@Component
@Profile({"local", "test"})
public class LoggingEndpointRegistry implements PushEndpointRegistry {

    @Override
    public String ensureEndpoint(String token) {
        String fakeArn = "arn:aws:sns:local:000000000000:endpoint/GCM/fake/" + Integer.toHexString(token.hashCode());
        log.info("SNS endpoint ensured (fake). token={}, endpointArn={}", mask(token), fakeArn);
        return fakeArn;
    }

    @Override
    public void deleteEndpoint(String endpointArn) {
        log.info("SNS endpoint delete skipped (fake). endpointArn={}", endpointArn);
    }

    private static String mask(String value) {
        if (value == null || value.length() < 8) return "***";
        return value.substring(0, 6) + "...";
    }
}
