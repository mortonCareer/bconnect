package to.bconnect.api.storage.attachment;

import org.springframework.data.jpa.repository.JpaRepository;

import java.time.Instant;
import java.util.Collection;
import java.util.List;

public interface AttachmentRepository extends JpaRepository<AttachmentEntity, Long> {

    List<AttachmentEntity> findAllByReferenceTypeAndReferenceIdIn(
            AttachmentReferenceType referenceType, Collection<Long> referenceIds);

    List<AttachmentEntity> findAllByReferenceTypeAndReferenceId(
            AttachmentReferenceType referenceType, Long referenceId);

    List<AttachmentEntity> findAllByReferenceTypeAndReferenceIdAndType(
            AttachmentReferenceType referenceType, Long referenceId, AttachmentType type);

    Collection<AttachmentEntity> findAllByReferenceTypeAndReferenceIdInAndType(
            AttachmentReferenceType referenceType, Collection<Long> referenceIds, AttachmentType type);

    List<AttachmentEntity> findAllByStatusAndCreatedAtBefore(AttachmentStatus status, Instant before);

    List<AttachmentEntity> findAllByStatusAndCreatedAtBeforeAndReferenceIdIsNull(AttachmentStatus status, Instant before);
}