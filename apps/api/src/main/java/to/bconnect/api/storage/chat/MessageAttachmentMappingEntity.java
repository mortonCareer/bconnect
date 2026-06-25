package to.bconnect.api.storage.chat;

import jakarta.persistence.*;
import lombok.AccessLevel;
import lombok.Getter;
import lombok.NoArgsConstructor;
import to.bconnect.api.storage.BaseEntity;

@Entity
@Table(
        name = "message_attachments",
        uniqueConstraints = @UniqueConstraint(columnNames = {"message_id", "attachment_id"})
)
@Getter
@NoArgsConstructor(access = AccessLevel.PROTECTED)
public class MessageAttachmentMappingEntity extends BaseEntity {

    @Column(nullable = false)
    private Long messageId;

    @Column(nullable = false)
    private Long attachmentId;

    public MessageAttachmentMappingEntity(Long messageId, Long attachmentId) {
        this.messageId = messageId;
        this.attachmentId = attachmentId;
    }
}
