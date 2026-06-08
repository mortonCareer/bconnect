package to.bconnect.api.core.storage.post;

import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface PostRepository extends JpaRepository<PostEntity, Long> {

    List<PostEntity> findByMemberId(Long memberId);

    List<PostEntity> findByTaskId(Long taskId);

    long countByMemberId(Long memberId);
}
