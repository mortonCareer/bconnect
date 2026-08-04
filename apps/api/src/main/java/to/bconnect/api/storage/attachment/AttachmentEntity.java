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

    private Long memberId;

    @Enumerated(EnumType.STRING)
    private AttachmentType type;

    @Enumerated(EnumType.STRING)
    private AttachmentStatus status = AttachmentStatus.PENDING;

    @Enumerated(EnumType.STRING)
    private AttachmentContext context;

    private Long contextId;

    @Enumerated(EnumType.STRING)
    private AttachmentReferenceType referenceType;

    private Long referenceId;

    private String uuid;

    private String stem;

    private String ext;

    private String contentType;

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

    public void link(AttachmentReferenceType referenceType, Long referenceId) {
        this.referenceType = referenceType;
        this.referenceId = referenceId;
    }

    public void unlink() {
        this.referenceType = null;
        this.referenceId = null;
    }
}
