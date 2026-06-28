package to.bconnect.api.storage.post;

import org.springframework.data.jpa.repository.JpaRepository;
import to.bconnect.api.storage.attachment.AttachmentContext;
import to.bconnect.api.storage.attachment.AttachmentReferenceProvider;

import java.util.Collection;
import java.util.List;
import java.util.Set;
import java.util.stream.Collectors;

public interface PostAttachmentMappingRepository extends JpaRepository<PostAttachmentMappingEntity, Long>, AttachmentReferenceProvider {

    List<PostAttachmentMappingEntity> findByPostIdIn(Collection<Long> postIds);

    List<PostAttachmentMappingEntity> findByAttachmentIdIn(Collection<Long> attachmentIds);

    void deleteByPostId(Long postId);

    void deleteByPostIdIn(Collection<Long> postIds);

    @Override
    default AttachmentContext context() {
        return AttachmentContext.POST;
    }

    @Override
    default Set<Long> referencedIds(Collection<Long> attachmentIds) {
        return findByAttachmentIdIn(attachmentIds).stream()
                .map(PostAttachmentMappingEntity::getAttachmentId)
                .collect(Collectors.toSet());
    }
}
