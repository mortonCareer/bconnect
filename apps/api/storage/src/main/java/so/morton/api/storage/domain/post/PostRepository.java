package so.morton.api.storage.domain.post;

import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface PostRepository extends JpaRepository<PostEntity, Long> {

    List<PostEntity> findByAuthorId(Long authorId);

    List<PostEntity> findByTaskId(Long taskId);
}
