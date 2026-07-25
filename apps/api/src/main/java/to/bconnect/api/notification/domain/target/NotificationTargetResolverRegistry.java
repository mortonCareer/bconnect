package to.bconnect.api.notification.domain.target;

import org.springframework.stereotype.Component;
import to.bconnect.api.common.CodeException;
import to.bconnect.api.core.domain.notification.NotificationEvent;
import to.bconnect.api.core.domain.notification.NotificationExceptionCode;
import to.bconnect.api.storage.notification.NotificationType;

import java.util.List;
import java.util.Map;
import java.util.function.Function;
import java.util.stream.Collectors;

@Component
public class NotificationTargetResolverRegistry {

    private final Map<NotificationType, NotificationTargetResolver<? extends NotificationEvent>> byType;

    public NotificationTargetResolverRegistry(List<NotificationTargetResolver<? extends NotificationEvent>> resolvers) {
        this.byType = Map.copyOf(resolvers.stream()
                .collect(Collectors.toMap(NotificationTargetResolver::supports, Function.identity())));
    }

    @SuppressWarnings("unchecked")
    public NotificationTargetResolver<NotificationEvent> get(NotificationType type) {
        NotificationTargetResolver<? extends NotificationEvent> resolver = byType.get(type);
        if (resolver == null) {
            throw new CodeException(NotificationExceptionCode.UNKNOWN_TYPE);
        }
        return (NotificationTargetResolver<NotificationEvent>) resolver;
    }
}
