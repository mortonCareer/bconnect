package to.bconnect.api.notification.domain.target;

import org.springframework.stereotype.Component;
import to.bconnect.api.common.CodeException;
import to.bconnect.api.core.domain.notification.NotificationExceptionCode;
import to.bconnect.api.notification.domain.NotificationType;

import java.util.List;
import java.util.Map;
import java.util.function.Function;
import java.util.stream.Collectors;

@Component
public class NotificationTargetResolverRegistry {

    private final Map<NotificationType, NotificationTargetResolver<?>> byType;

    public NotificationTargetResolverRegistry(List<NotificationTargetResolver<?>> resolvers) {
        this.byType = resolvers.stream()
                .collect(Collectors.toMap(NotificationTargetResolver::supports, Function.identity()));
    }

    @SuppressWarnings("unchecked")
    public NotificationTargetResolver<Object> get(NotificationType typeCode) {
        NotificationTargetResolver<?> resolver = byType.get(typeCode);
        if (resolver == null) {
            throw new CodeException(NotificationExceptionCode.UNKNOWN_TYPE);
        }
        return (NotificationTargetResolver<Object>) resolver;
    }
}
