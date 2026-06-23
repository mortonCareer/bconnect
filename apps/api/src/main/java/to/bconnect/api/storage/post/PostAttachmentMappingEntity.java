package to.bconnect.api.storage.post;

import jakarta.persistence.*;
import lombok.AccessLevel;
import lombok.Getter;
import lombok.NoArgsConstructor;
import to.bconnect.api.storage.BaseEntity;

@Entity
@Table(
        name = "post_attachments",
        uniqueConstraints = @UniqueConstraint(columnNames = {"post_id", "attachment_id"})
)
@Getter
@NoArgsConstructor(access = AccessLevel.PROTECTED)
public class PostAttachmentMappingEntity extends BaseEntity {

    @Column(nullable = false)
    private Long postId;

    @Column(nullable = false)
    private Long attachmentId;

    public PostAttachmentMappingEntity(Long postId, Long attachmentId) {
        this.postId = postId;
        this.attachmentId = attachmentId;
    }
}
