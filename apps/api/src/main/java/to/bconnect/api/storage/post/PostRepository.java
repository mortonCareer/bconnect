package to.bconnect.api.storage.post;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.Collection;
import java.util.List;

public interface PostRepository extends JpaRepository<PostEntity, Long> {

    List<PostEntity> findByMemberId(Long memberId);

    List<PostEntity> findByTaskId(Long taskId);

    long countByMemberId(Long memberId);

    @Query("SELECT p.memberId, COUNT(p) FROM PostEntity p WHERE p.memberId IN :memberIds GROUP BY p.memberId")
    List<Object[]> countByMemberIdIn(@Param("memberIds") Collection<Long> memberIds);
}
