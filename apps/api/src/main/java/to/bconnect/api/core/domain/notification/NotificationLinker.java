package to.bconnect.api.core.domain.notification;

import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import to.bconnect.api.storage.notification.NotificationEntity;
import to.bconnect.api.storage.notification.NotificationRepository;

import java.util.LinkedHashMap;
import java.util.Map;

@Service
@RequiredArgsConstructor
public class NotificationLinker {

    private final NotificationRepository notificationRepository;

    @Transactional
    public Map<Long, Long> link(NotificationLinkCommand command) {
        Map<Long, Long> linked = new LinkedHashMap<>();
        for (Long receiverId : command.receiverIds()) {
            Long id = notificationRepository.save(new NotificationEntity(
                    command.senderId(), receiverId, command.type(),
                    command.referenceId(), command.content(), command.args())).getId();
            linked.put(receiverId, id);
        }
        return Map.copyOf(linked);
    }
}
