package so.morton.api.storage.repository;

import so.morton.api.storage.entity.PostEntity;
import org.springframework.data.jpa.repository.JpaRepository;
import so.morton.api.storage.value.EntityStatus;

import java.util.List;

public interface PostRepository extends JpaRepository<PostEntity, Long> {

    List<PostEntity> findByAuthorId(Long authorId);

    List<PostEntity> findByTaskId(Long taskId);

    List<PostEntity> findAllByStatus(EntityStatus status);
}
