package to.bconnect.api.storage.notification;

import jakarta.persistence.Column;
import jakarta.persistence.Embedded;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.Table;
import lombok.AccessLevel;
import lombok.Getter;
import lombok.NoArgsConstructor;
import to.bconnect.api.storage.BaseEntity;

import java.time.Instant;

@Entity
@Table(name = "notifications")
@Getter
@NoArgsConstructor(access = AccessLevel.PROTECTED)
public class NotificationEntity extends BaseEntity {

    private Long senderId;

    @Column(nullable = false)
    private Long receiverId;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private NotificationType typeCode;

    private Long referenceId;

    @Column(columnDefinition = "text")
    private String content;

    @Embedded
    private NotificationArgs args;

    private Instant readAt;

    public NotificationEntity(Long senderId, Long receiverId, NotificationType typeCode, Long referenceId, String content) {
        this(senderId, receiverId, typeCode, referenceId, content, null);
    }

    public NotificationEntity(Long senderId, Long receiverId, NotificationType typeCode, Long referenceId,
                              String content, NotificationArgs args) {
        this.senderId = senderId;
        this.receiverId = receiverId;
        this.typeCode = typeCode;
        this.referenceId = referenceId;
        this.content = content;
        this.args = args;
    }

    public NotificationArgs getArgs() {
        return args == null ? NotificationArgs.empty() : args;
    }

    public boolean isRead() {
        return readAt != null;
    }

    public void markRead() {
        if (readAt == null) readAt = Instant.now();
    }
}
