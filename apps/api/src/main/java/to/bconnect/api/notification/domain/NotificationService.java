package to.bconnect.api.notification.domain;

import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Propagation;
import org.springframework.transaction.annotation.Transactional;
import to.bconnect.api.storage.notification.NotificationEntity;
import to.bconnect.api.storage.notification.NotificationRepository;

import java.util.List;

@Component
@RequiredArgsConstructor
public class NotificationService {

    private final NotificationRepository notificationRepository;

    @Transactional(propagation = Propagation.REQUIRES_NEW)
    public List<NotificationEntity> create(List<PushNotification> commands) {
        if (commands.isEmpty()) return List.of();

        return notificationRepository.saveAll(commands.stream()
                .map(it -> new NotificationEntity(
                        it.memberId(),
                        it.type(),
                        it.senderType(),
                        it.senderId(),
                        it.referenceType(),
                        it.referenceId(),
                        false))
                .toList());
    }
}
