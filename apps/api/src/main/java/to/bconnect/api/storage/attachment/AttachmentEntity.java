package to.bconnect.api.storage.attachment;

import jakarta.persistence.*;
import lombok.AccessLevel;
import lombok.Getter;
import lombok.NoArgsConstructor;
import to.bconnect.api.storage.BaseEntity;

@Entity
@Table(name = "attachments")
@Getter
@NoArgsConstructor(access = AccessLevel.PROTECTED)
public class AttachmentEntity extends BaseEntity {

    @Column(nullable = false)
    private Long memberId;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private AttachmentType type;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private AttachmentStatus status = AttachmentStatus.PENDING;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private AttachmentContext context;

    @Column(nullable = false)
    private Long contextId;

    @Column(nullable = false, unique = true)
    private String uuid;

    @Column(nullable = false)
    private String stem;

    @Column(nullable = false)
    private String ext;

    @Column(nullable = false)
    private String contentType;

    @Column(nullable = false)
    private Long size;

    public AttachmentEntity(Long memberId, AttachmentType type, AttachmentContext context, Long contextId,
                            String uuid, String stem, String ext, String contentType, Long size) {
        this.memberId = memberId;
        this.type = type;
        this.context = context;
        this.contextId = contextId;
        this.uuid = uuid;
        this.stem = stem;
        this.ext = ext;
        this.contentType = contentType;
        this.size = size;
    }

    public void complete() {
        this.status = AttachmentStatus.COMPLETED;
    }
}
