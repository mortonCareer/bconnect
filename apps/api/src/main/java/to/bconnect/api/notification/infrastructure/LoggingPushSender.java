package to.bconnect.api.notification.infrastructure;

import lombok.extern.slf4j.Slf4j;
import org.springframework.context.annotation.Profile;
import org.springframework.stereotype.Component;
import to.bconnect.api.notification.domain.push.PushNotification;
import to.bconnect.api.notification.domain.push.PushSendResult;
import to.bconnect.api.notification.domain.push.PushSender;

@Slf4j
@Component
@Profile({"local", "test"})
public class LoggingPushSender implements PushSender {

    @Override
    public PushSendResult send(String endpoint, PushNotification command) {
        log.info("Push skipped. endpoint={}, title={}, body={}, referenceId={}",
                endpoint,
                command.title(),
                command.body(),
                command.referenceId());
        return PushSendResult.SUCCESS;
    }
}
