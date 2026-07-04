package to.bconnect.api.storage.attachment;

import org.springframework.data.jpa.repository.JpaRepository;

import java.time.LocalDateTime;
import java.util.Collection;
import java.util.List;

public interface AttachmentRepository extends JpaRepository<AttachmentEntity, Long> {

    List<AttachmentEntity> findByReferenceTypeAndReferenceIdIn(
            ReferenceType referenceType, Collection<Long> referenceIds);

    List<AttachmentEntity> findByReferenceTypeAndReferenceIdAndType(
            ReferenceType referenceType, Long referenceId, AttachmentType type);

    List<AttachmentEntity> findByStatusAndCreatedAtBefore(AttachmentStatus status, LocalDateTime before);

    List<AttachmentEntity> findByStatusAndCreatedAtBeforeAndReferenceIdIsNull(
            AttachmentStatus status, LocalDateTime before);
}
