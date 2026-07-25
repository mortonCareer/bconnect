package to.bconnect.api.notification.domain.target;

import org.springframework.stereotype.Component;
import to.bconnect.api.notification.domain.MemberFirstDeviceRegisteredEvent;
import to.bconnect.api.storage.notification.NotificationType;

import java.util.Set;

@Component
public class SignupWelcomeTargetResolver implements NotificationTargetResolver<MemberFirstDeviceRegisteredEvent> {

    @Override
    public NotificationType supports() {
        return NotificationType.SIGNUP_WELCOME;
    }

    @Override
    public ResolvedNotification resolve(MemberFirstDeviceRegisteredEvent event) {
        Set<Long> self = Set.of(event.memberId());
        return new ResolvedNotification(null, null, null, new ResolvedNotification.Targets(self, self));
    }
}
