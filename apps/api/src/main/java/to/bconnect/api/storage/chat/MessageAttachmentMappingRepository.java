package to.bconnect.api.storage.chat;

import org.springframework.data.jpa.repository.JpaRepository;
import to.bconnect.api.storage.attachment.AttachmentContext;
import to.bconnect.api.storage.attachment.AttachmentReferenceProvider;

import java.util.Collection;
import java.util.List;
import java.util.Set;
import java.util.stream.Collectors;

public interface MessageAttachmentMappingRepository extends JpaRepository<MessageAttachmentMappingEntity, Long>, AttachmentReferenceProvider {

    List<MessageAttachmentMappingEntity> findByMessageIdIn(Collection<Long> messageIds);

    List<MessageAttachmentMappingEntity> findByAttachmentIdIn(Collection<Long> attachmentIds);

    @Override
    default AttachmentContext context() {
        return AttachmentContext.CHAT;
    }

    @Override
    default Set<Long> referencedIds(Collection<Long> attachmentIds) {
        return findByAttachmentIdIn(attachmentIds).stream()
                .map(MessageAttachmentMappingEntity::getAttachmentId)
                .collect(Collectors.toSet());
    }
}
