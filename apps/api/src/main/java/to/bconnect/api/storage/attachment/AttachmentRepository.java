package to.bconnect.api.storage.attachment;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.time.LocalDateTime;
import java.util.Collection;
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

    @Query(value = "SELECT * FROM attachments WHERE deleted_at IS NOT NULL", nativeQuery = true)
    List<AttachmentEntity> findDeleted();

    @Modifying
    @Query(value = "UPDATE credentials SET attachment_id = NULL WHERE attachment_id IN :ids", nativeQuery = true)
    void purgeCredentialReferences(@Param("ids") Collection<Long> ids);

    @Modifying
    @Query(value = "DELETE FROM message_attachments WHERE attachment_id IN :ids", nativeQuery = true)
    void purgeMessageMappings(@Param("ids") Collection<Long> ids);

    @Modifying
    @Query(value = "DELETE FROM attachments WHERE id IN :ids", nativeQuery = true)
    void purge(@Param("ids") Collection<Long> ids);
}
