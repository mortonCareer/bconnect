package to.bconnect.api.storage.attachment;

import jakarta.persistence.*;
import lombok.AccessLevel;
import lombok.Getter;
import lombok.NoArgsConstructor;
import org.springframework.util.StringUtils;
import to.bconnect.api.storage.BaseEntity;

import java.util.Locale;
import java.util.UUID;

@Entity
@Table(name = "attachments")
@Getter
@NoArgsConstructor(access = AccessLevel.PROTECTED)
public class AttachmentEntity extends BaseEntity {

    @Column(nullable = false)
    private Long memberId;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private AttachmentContext context;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private AttachmentType type;

    @Column(nullable = false)
    private Long contextId;

    @Column(nullable = false)
    private String filename;

    @Column(nullable = false, unique = true)
    private UUID uuid;

    @Column(nullable = false)
    private String contentType;

    @Column(nullable = false)
    private Long size;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private AttachmentStatus status = AttachmentStatus.PENDING;

    public AttachmentEntity(Long memberId, AttachmentContext context, AttachmentType type, Long contextId,
                            String filename, String contentType, Long size) {
        this.memberId = memberId;
        this.context = context;
        this.type = type;
        this.contextId = contextId;
        this.filename = filename;
        this.uuid = UUID.randomUUID();
        this.contentType = contentType;
        this.size = size;
    }

    public void complete() {
        this.status = AttachmentStatus.COMPLETED;
    }

    public String extensionOf() {
        String extension = StringUtils.getFilenameExtension(filename);
        return extension == null ? "" : extension.toLowerCase(Locale.ROOT);
    }
}
