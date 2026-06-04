package to.bconnect.api.storage.domain.post;

import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface PostRepository extends JpaRepository<PostEntity, Long> {

    List<PostEntity> findByProfileId(Long profileId);

    List<PostEntity> findByTaskId(Long taskId);

    long countByProfileId(Long profileId);
}
