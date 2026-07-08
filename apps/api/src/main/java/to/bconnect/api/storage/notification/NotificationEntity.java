package to.bconnect.api.storage.notification;

import jakarta.persistence.*;
import lombok.AccessLevel;
import lombok.Getter;
import lombok.NoArgsConstructor;
import to.bconnect.api.storage.BaseEntity;

import java.time.LocalDateTime;

@Entity
@Table(name = "notifications")
@Getter
@NoArgsConstructor(access = AccessLevel.PROTECTED)
public class NotificationEntity extends BaseEntity {

    private Long senderId;

    @Column(nullable = false)
    private Long receiverId;

    @Column(nullable = false)
    private String typeCode;

    private Long referenceId;

    @Column(columnDefinition = "text")
    private String content;

    @Column(columnDefinition = "text")
    private String templateArgs;

    private LocalDateTime readAt;

    public NotificationEntity(Long senderId, Long receiverId, String typeCode, Long referenceId, String content) {
        this(senderId, receiverId, typeCode, referenceId, content, null);
    }

    public NotificationEntity(Long senderId, Long receiverId, String typeCode, Long referenceId,
                              String content, String templateArgs) {
        this.senderId = senderId;
        this.receiverId = receiverId;
        this.typeCode = typeCode;
        this.referenceId = referenceId;
        this.content = content;
        this.templateArgs = templateArgs;
    }

    public boolean isRead() {
        return readAt != null;
    }

    public void markRead() {
        if (readAt == null) readAt = LocalDateTime.now();
    }
}
