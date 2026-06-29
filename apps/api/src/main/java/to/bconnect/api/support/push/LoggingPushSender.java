package to.bconnect.api.support.push;

import lombok.extern.slf4j.Slf4j;
import org.springframework.context.annotation.Profile;
import org.springframework.stereotype.Component;

@Slf4j
@Component
@Profile({"local", "test"})
public class LoggingPushSender implements PushSender {

    @Override
    public PushSendResult send(String endpointArn, PushPayload payload) {
        log.info("Push skipped. endpointArn={}, title={}, url={}",
                mask(endpointArn), payload.title(), payload.url());
        return PushSendResult.success(endpointArn, "logging");
    }

    private static String mask(String value) {
        if (value == null || value.length() < 12) return "***";
        return value.substring(0, 8) + "...";
    }
}
