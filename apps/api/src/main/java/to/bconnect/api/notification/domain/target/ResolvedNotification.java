package to.bconnect.api.notification.domain.target;

import to.bconnect.api.storage.notification.NotificationArgs;

import java.util.Set;

public record ResolvedNotification(Long senderId, Long referenceId, String content,
                                   NotificationArgs args, Targets targets) {

    /** 저장 대상 / push 대상. */
    public record Targets(Set<Long> persistReceiverIds, Set<Long> pushReceiverIds) {
        public Targets {
            persistReceiverIds = Set.copyOf(persistReceiverIds);
            pushReceiverIds = Set.copyOf(pushReceiverIds);
        }
    }
}
