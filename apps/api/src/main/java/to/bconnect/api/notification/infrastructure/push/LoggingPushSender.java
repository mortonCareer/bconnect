package to.bconnect.api.notification.infrastructure.push;

import lombok.extern.slf4j.Slf4j;
import org.springframework.context.annotation.Profile;
import org.springframework.stereotype.Component;
import to.bconnect.api.notification.domain.push.PushPayload;
import to.bconnect.api.notification.domain.push.PushSendResult;
import to.bconnect.api.notification.domain.push.PushSender;

@Slf4j
@Component
@Profile({"local", "test"})
public class LoggingPushSender implements PushSender {

    @Override
    public PushSendResult send(String endpointArn, PushPayload payload) {
        log.info("Push skipped. endpointArn={}, title={}, url={}",
                mask(endpointArn), payload.title(), payload.link());
        return PushSendResult.success(endpointArn, "logging");
    }

    private static String mask(String value) {
        if (value == null || value.length() < 12) return "***";
        return value.substring(0, 8) + "...";
    }
}
