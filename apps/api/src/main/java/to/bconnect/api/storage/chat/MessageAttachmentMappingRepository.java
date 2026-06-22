package to.bconnect.api.storage.chat;

import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Collection;
import java.util.List;

public interface MessageAttachmentMappingRepository extends JpaRepository<MessageAttachmentMappingEntity, Long> {

    List<MessageAttachmentMappingEntity> findByMessageIdIn(Collection<Long> messageIds);
}
