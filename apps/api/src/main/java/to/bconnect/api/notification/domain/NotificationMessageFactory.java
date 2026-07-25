package to.bconnect.api.notification.domain;

import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Component;
import to.bconnect.api.core.domain.member.MemberResolver;
import to.bconnect.api.notification.domain.push.PushNotification;
import to.bconnect.api.storage.notification.NotificationArgs;
import to.bconnect.api.storage.notification.NotificationType;

@Component
@RequiredArgsConstructor
public class NotificationMessageFactory {

    private static final int PREVIEW_MAX = 100;

    private final MemberResolver memberResolver;

    public NotificationArgs createArgs(NotificationType type, Long senderId) {
        return switch (type) {
            case CHAT_MESSAGE, COWORKER_REQUESTED, CONTRACT_WRITTEN -> senderId == null
                    ? NotificationArgs.empty()
                    : NotificationArgs.senderName(memberResolver.get(senderId).name());
            // OFFER(companyName)·시스템 알림은 트리거 배선 시 각 이벤트에서 args 를 채운다.
            case OFFER_RECEIVED, SIGNUP_WELCOME, PROFILE_COMPLETION -> NotificationArgs.empty();
        };
    }

    public PushNotification create(NotificationType type, Long referenceId, String content, NotificationArgs args) {
        String title = type.render(args);
        String body = truncate(content);
        String link = type.link(referenceId);
        return new PushNotification(type, referenceId, title, body, link);
    }

    private static String truncate(String text) {
        if (text == null) return "";
        return text.length() <= PREVIEW_MAX ? text : text.substring(0, PREVIEW_MAX) + "…";
    }
}
