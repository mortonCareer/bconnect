package to.bconnect.api.attachment;

import lombok.RequiredArgsConstructor;
import lombok.val;
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
        val before = LocalDateTime.now().minus(PENDING_RETENTION);
        val attachments =
                attachmentRepository.findByStatusAndCreatedAtBefore(AttachmentStatus.PENDING, before);

        purge(attachments);
        return attachments.size();
    }

    // completed but not referenced
    private int cleanupOrphans() {
        val before = LocalDateTime.now().minus(ORPHAN_RETENTION);
        val orphans = attachmentRepository
                .findByStatusAndCreatedAtBeforeAndReferenceIdIsNull(AttachmentStatus.COMPLETED, before);

        purge(orphans);
        return orphans.size();
    }

    private void purge(List<AttachmentEntity> attachments) {
        if (attachments.isEmpty())
            return;

        val keys = attachments.stream()
                .flatMap(it -> AttachmentKeyUtils.allKeys(
                        it.getContext(), it.getContextId(), it.getType(), it.getUuid(), it.getExt()).stream())
                .toList();
        fileStorage.deleteAll(keys);
        attachmentRepository.deleteAll(attachments);
    }
}
