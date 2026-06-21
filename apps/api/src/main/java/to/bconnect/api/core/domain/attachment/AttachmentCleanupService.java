package to.bconnect.api.core.domain.attachment;

import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import to.bconnect.api.storage.attachment.AttachmentEntity;
import to.bconnect.api.storage.attachment.AttachmentRepository;
import to.bconnect.api.storage.attachment.AttachmentStatus;
import to.bconnect.api.support.s3.S3FileStorage;

import java.time.Duration;
import java.time.LocalDateTime;
import java.util.List;

@Service
@RequiredArgsConstructor
public class AttachmentCleanupService {

    private static final Duration PENDING_RETENTION = Duration.ofHours(24);
    private static final Duration ORPHAN_RETENTION = Duration.ofHours(24);

    private final AttachmentRepository attachmentRepository;
    private final S3FileStorage fileStorage;

    @Transactional
    public CleanupResult cleanup() {
        return new CleanupResult(
                cleanupPending(),
                cleanupOrphans()
        );
    }

    // presigned but not confirmed
    private int cleanupPending() {
        LocalDateTime before = LocalDateTime.now().minus(PENDING_RETENTION);
        List<AttachmentEntity> attachments =
                attachmentRepository.findByStatusAndCreatedAtBefore(AttachmentStatus.PENDING, before);

        attachments.forEach(it -> fileStorage.deleteAll(AttachmentKeyUtils.allKeys(it.getContext(), it.getContextId(), it.getType(), it.getUuid(), it.getExt())));
        attachmentRepository.deleteAll(attachments);
        return attachments.size();
    }

    // completed but not related
    private int cleanupOrphans() {
        LocalDateTime before = LocalDateTime.now().minus(ORPHAN_RETENTION);
        List<AttachmentEntity> attachments =
                attachmentRepository.findOrphans(AttachmentStatus.COMPLETED, before);

        attachments.forEach(it -> fileStorage.deleteAll(AttachmentKeyUtils.allKeys(it.getContext(), it.getContextId(), it.getType(), it.getUuid(), it.getExt())));
        attachmentRepository.deleteAll(attachments);
        return attachments.size();
    }
}
