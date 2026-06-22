package to.bconnect.api.core.domain.attachment;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import to.bconnect.api.storage.attachment.AttachmentContext;
import to.bconnect.api.storage.attachment.AttachmentEntity;
import to.bconnect.api.storage.attachment.AttachmentReferenceProvider;
import to.bconnect.api.storage.attachment.AttachmentRepository;
import to.bconnect.api.storage.attachment.AttachmentStatus;
import to.bconnect.api.support.s3.S3FileStorage;

import java.time.Duration;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;
import java.util.Map;
import java.util.Set;
import java.util.function.Function;
import java.util.stream.Collectors;

@Service
public class AttachmentCleanupService {

    private static final Duration PENDING_RETENTION = Duration.ofHours(24);
    private static final Duration ORPHAN_RETENTION = Duration.ofHours(24);

    private final AttachmentRepository attachmentRepository;
    private final S3FileStorage fileStorage;
    private final Map<AttachmentContext, AttachmentReferenceProvider> referenceProviders;

    public AttachmentCleanupService(AttachmentRepository attachmentRepository,
                                    S3FileStorage fileStorage,
                                    List<AttachmentReferenceProvider> referenceProviders) {
        this.attachmentRepository = attachmentRepository;
        this.fileStorage = fileStorage;
        this.referenceProviders = referenceProviders.stream()
                .collect(Collectors.toUnmodifiableMap(AttachmentReferenceProvider::context, Function.identity()));
        for (AttachmentContext context : AttachmentContext.values()) {
            if (!this.referenceProviders.containsKey(context))
                throw new IllegalStateException("AttachmentReferenceProvider 미등록 context: " + context);
        }
    }

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

        purge(attachments);
        return attachments.size();
    }

    // completed but not related
    private int cleanupOrphans() {
        LocalDateTime before = LocalDateTime.now().minus(ORPHAN_RETENTION);
        List<AttachmentEntity> orphans = new ArrayList<>();
        for (AttachmentReferenceProvider provider : referenceProviders.values()) {
            List<AttachmentEntity> candidates = attachmentRepository
                    .findByContextAndStatusAndCreatedAtBefore(provider.context(), AttachmentStatus.COMPLETED, before);
            if (candidates.isEmpty())
                continue;

            Set<Long> referenced = provider.referencedIds(candidates.stream().map(AttachmentEntity::getId).toList());
            candidates.stream()
                    .filter(it -> !referenced.contains(it.getId()))
                    .forEach(orphans::add);
        }

        purge(orphans);
        return orphans.size();
    }

    private void purge(List<AttachmentEntity> attachments) {
        if (attachments.isEmpty())
            return;

        List<String> keys = attachments.stream()
                .flatMap(it -> AttachmentKeyUtils.allKeys(
                        it.getContext(), it.getContextId(), it.getType(), it.getUuid(), it.getExt()).stream())
                .toList();
        fileStorage.deleteAll(keys);
        attachmentRepository.deleteAll(attachments);
    }
}
