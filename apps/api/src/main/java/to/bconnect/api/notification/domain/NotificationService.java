package to.bconnect.api.notification.domain;

import lombok.RequiredArgsConstructor;
import lombok.val;
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
    public List<Notification> create(List<CreateNotification> commands) {
        if (commands.isEmpty()) return List.of();

        val created = notificationRepository.saveAll(commands.stream()
                .map(it -> new NotificationEntity(
                        it.memberId(),
                        it.type(),
                        it.senderType(),
                        it.senderId(),
                        it.referenceType(),
                        it.referenceId(),
                        false))
                .toList());

        return created.stream()
                .map(Notification::of)
                .toList();
    }
}
