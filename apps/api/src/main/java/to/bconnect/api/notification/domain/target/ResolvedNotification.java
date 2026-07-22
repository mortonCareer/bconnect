package to.bconnect.api.notification.domain.target;

import java.util.Set;

public record ResolvedNotification(Long senderId, Long referenceId, String content, Targets targets) {

    /** 저장 대상 / push 대상. */
    public record Targets(Set<Long> persistReceiverIds, Set<Long> pushReceiverIds) {}
}
