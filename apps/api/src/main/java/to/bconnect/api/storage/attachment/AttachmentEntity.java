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

    @Column(nullable = false)
    private String filename;

    @Column(nullable = false, length = 500)
    private String path;

    @Column(nullable = false, length = 100)
    private String contentType;

    @Column(nullable = false)
    private Long size;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private AttachmentStatus status = AttachmentStatus.PENDING;

    public AttachmentEntity(Long memberId, String filename, String path, String contentType, Long size) {
        this.memberId = memberId;
        this.filename = filename;
        this.path = path;
        this.contentType = contentType;
        this.size = size;
    }

    public void complete() {
        this.status = AttachmentStatus.COMPLETED;
    }
}
