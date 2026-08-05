package to.bconnect.api.notification.domain;

import lombok.RequiredArgsConstructor;
import lombok.val;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import to.bconnect.api.common.CodeException;
import to.bconnect.api.common.CommonExceptionCode;
import to.bconnect.api.common.request.CursorLimit;
import to.bconnect.api.common.response.CursorPage;
import to.bconnect.api.security.AuthUser;
import to.bconnect.api.storage.notification.NotificationRepository;

@Service
@RequiredArgsConstructor
public class NotificationQueryService {

    private final NotificationRepository notificationRepository;

    @Transactional(readOnly = true)
    public CursorPage<Notification> list(AuthUser user, CursorLimit cursor) {
        val window = notificationRepository.findByMemberId(
                user.id(), cursor.toScrollPosition(), cursor.toLimit(), cursor.toSort());

        return CursorPage.from(window.map(Notification::of), Notification::id);
    }

    @Transactional(readOnly = true)
    public long unreadCount(AuthUser user) {
        return notificationRepository.countByMemberIdAndReadIsFalse(user.id());
    }

    @Transactional
    public void markRead(AuthUser user, Long id) {
        val notification = notificationRepository.findById(id)
                .orElseThrow(() -> new CodeException(CommonExceptionCode.NOT_FOUND));
        if (!notification.getMemberId().equals(user.id()))
            throw new CodeException(CommonExceptionCode.FORBIDDEN);

        notification.markRead();
    }

    @Transactional
    public void markAllRead(AuthUser user) {
        notificationRepository.markAllReadByMemberId(user.id());
    }
}
