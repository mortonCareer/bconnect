package to.bconnect.api.storage.chat;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import to.bconnect.api.storage.attachment.AttachmentContext;
import to.bconnect.api.storage.attachment.AttachmentReferenceProvider;

import java.util.Collection;
import java.util.List;
import java.util.Set;

public interface MessageAttachmentMappingRepository extends JpaRepository<MessageAttachmentMappingEntity, Long>, AttachmentReferenceProvider {

    List<MessageAttachmentMappingEntity> findByMessageIdIn(Collection<Long> messageIds);

    @Override
    default AttachmentContext context() {
        return AttachmentContext.CHAT;
    }

    @Override
    @Query("SELECT ma.attachmentId FROM MessageAttachmentMappingEntity ma WHERE ma.attachmentId IN :attachmentIds")
    Set<Long> referencedIds(@Param("attachmentIds") Collection<Long> attachmentIds);
}
