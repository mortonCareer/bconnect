package to.bconnect.api.storage.post;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import to.bconnect.api.storage.attachment.AttachmentContext;
import to.bconnect.api.storage.attachment.AttachmentReferenceProvider;

import java.util.Collection;
import java.util.List;
import java.util.Set;

public interface PostAttachmentMappingRepository extends JpaRepository<PostAttachmentMappingEntity, Long>, AttachmentReferenceProvider {

    List<PostAttachmentMappingEntity> findByPostIdIn(Collection<Long> postIds);

    void deleteByPostId(Long postId);

    @Override
    default AttachmentContext context() {
        return AttachmentContext.POST;
    }

    @Override
    @Query("SELECT pa.attachmentId FROM PostAttachmentMappingEntity pa WHERE pa.attachmentId IN :attachmentIds")
    Set<Long> referencedIds(@Param("attachmentIds") Collection<Long> attachmentIds);
}
