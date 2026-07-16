package to.bconnect.api.core.domain.notification;

import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import to.bconnect.api.common.CodeException;
import to.bconnect.api.common.request.CursorLimit;
import to.bconnect.api.common.response.CursorPage;
import to.bconnect.api.security.AuthUser;
import to.bconnect.api.storage.notification.NotificationEntity;
import to.bconnect.api.storage.notification.NotificationRepository;

import java.time.Instant;

@Service
@RequiredArgsConstructor
public class NotificationQueryService {

    private final NotificationRepository notificationRepository;

    @Transactional(readOnly = true)
    public CursorPage<Notification> list(AuthUser user, CursorLimit cursor) {
        var window = notificationRepository.findByReceiverId(
                user.id(), cursor.toScrollPosition(), cursor.toLimit(), cursor.toSort());
        return CursorPage.from(window.map(Notification::of), Notification::id);
    }

    @Transactional(readOnly = true)
    public long unreadCount(AuthUser user) {
        return notificationRepository.countByReceiverIdAndReadAtIsNull(user.id());
    }

    @Transactional
    public void markRead(AuthUser user, Long id) {
        NotificationEntity notification = notificationRepository.findById(id)
                .orElseThrow(() -> new CodeException(NotificationExceptionCode.NOT_FOUND));
        if (!notification.getReceiverId().equals(user.id()))
            throw new CodeException(NotificationExceptionCode.FORBIDDEN);
        notification.markRead();
    }

    @Transactional
    public void markAllRead(AuthUser user) {
        notificationRepository.markAllReadByReceiverId(user.id(), Instant.now());
    }
}
