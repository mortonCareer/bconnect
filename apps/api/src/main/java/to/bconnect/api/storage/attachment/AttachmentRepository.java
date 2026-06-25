package to.bconnect.api.storage.attachment;

import org.springframework.data.jpa.repository.JpaRepository;

import java.time.LocalDateTime;
import java.util.List;

public interface AttachmentRepository extends JpaRepository<AttachmentEntity, Long> {

    List<AttachmentEntity> findByStatusAndCreatedAtBefore(AttachmentStatus status, LocalDateTime before);

    List<AttachmentEntity> findByContextAndStatusAndCreatedAtBefore(
            AttachmentContext context, AttachmentStatus status, LocalDateTime before);
}
