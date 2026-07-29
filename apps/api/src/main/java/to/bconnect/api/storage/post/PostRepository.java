package to.bconnect.api.storage.post;

import org.springframework.data.domain.Limit;
import org.springframework.data.domain.ScrollPosition;
import org.springframework.data.domain.Sort;
import org.springframework.data.domain.Window;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.Collection;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

public interface PostRepository extends JpaRepository<PostEntity, Long> {

    Window<PostEntity> findAllBy(ScrollPosition position, Limit limit, Sort sort);

    List<PostEntity> findAllByTaskIdIn(Collection<Long> taskIds);

    List<PostEntity> findAllByTaskId(Long taskId);

    List<PostEntity> findAllByMemberId(Long memberId);

    long countByMemberId(Long memberId);

    default Map<Long, Long> countByMemberIdIn(Collection<Long> memberIds) {
        return countByMemberIdInRows(memberIds).stream()
                .collect(Collectors.toMap(
                        it -> ((Number) it[0]).longValue(),
                        it -> ((Number) it[1]).longValue()
                ));
    }

    @Query("SELECT p.memberId, COUNT(p) FROM PostEntity p WHERE p.memberId IN :memberIds GROUP BY p.memberId")
    List<Object[]> countByMemberIdInRows(@Param("memberIds") Collection<Long> memberIds);
}
