package to.bconnect.api.storage.post;

import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Collection;
import java.util.List;

public interface PostAttachmentMappingRepository extends JpaRepository<PostAttachmentMappingEntity, Long> {

    List<PostAttachmentMappingEntity> findByPostIdIn(Collection<Long> postIds);

    void deleteByPostId(Long postId);
}
