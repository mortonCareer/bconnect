package to.bconnect.api.storage.attachment;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.time.LocalDateTime;
import java.util.List;

public interface AttachmentRepository extends JpaRepository<AttachmentEntity, Long> {

    List<AttachmentEntity> findByStatusAndCreatedAtBefore(AttachmentStatus status, LocalDateTime before);

    @Query("""
            SELECT a FROM AttachmentEntity a
            WHERE a.status = :status AND a.createdAt < :before
            AND NOT EXISTS (SELECT c FROM CredentialEntity c WHERE c.attachment = a)
            AND NOT EXISTS (SELECT m FROM MessageEntity m JOIN m.attachments ma WHERE ma = a)
            """)
    List<AttachmentEntity> findOrphans(@Param("status") AttachmentStatus status, @Param("before") LocalDateTime before);
}
