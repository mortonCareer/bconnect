package to.bconnect.api.storage.attachment;

import org.springframework.data.jpa.repository.JpaRepository;

import java.time.OffsetDateTime;
import java.util.Collection;
import java.util.List;

public interface AttachmentRepository extends JpaRepository<AttachmentEntity, Long> {

    List<AttachmentEntity> findAllByReferenceTypeAndReferenceIdIn(
            ReferenceType referenceType, Collection<Long> referenceIds);

    List<AttachmentEntity> findAllByReferenceTypeAndReferenceIdAndType(
            ReferenceType referenceType, Long referenceId, AttachmentType type);

    List<AttachmentEntity> findAllByStatusAndCreatedAtBefore(AttachmentStatus status, OffsetDateTime before);

    List<AttachmentEntity> findAllByStatusAndCreatedAtBeforeAndReferenceIdIsNull(
            AttachmentStatus status, OffsetDateTime before);
}
