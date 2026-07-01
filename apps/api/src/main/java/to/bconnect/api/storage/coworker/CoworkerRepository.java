package to.bconnect.api.storage.coworker;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.Collection;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Optional;

public interface CoworkerRepository extends JpaRepository<CoworkerEntity, Long> {

    default boolean existsByMembers(Long memberId, Long coworkerId) {
        return existsByMinIdAndMaxId(Math.min(memberId, coworkerId), Math.max(memberId, coworkerId));
    }

    boolean existsByMinIdAndMaxId(Long minId, Long maxId);

    default Optional<CoworkerEntity> findByMembers(Long memberId, Long coworkerId) {
        return findByMinIdAndMaxId(Math.min(memberId, coworkerId), Math.max(memberId, coworkerId));
    }

    Optional<CoworkerEntity> findByMinIdAndMaxId(Long minId, Long maxId);

    default List<CoworkerEntity> findByMemberId(Long memberId) {
        return findByMinIdOrMaxId(memberId, memberId);
    }

    List<CoworkerEntity> findByMinIdOrMaxId(Long minId, Long maxId);

    default long countByMemberId(Long memberId) {
        return countByMinIdOrMaxId(memberId, memberId);
    }

    long countByMinIdOrMaxId(Long minId, Long maxId);

    default Map<Long, Long> countByMemberIdIn(Collection<Long> memberIds) {
        Map<Long, Long> counts = new HashMap<>();
        countByMinIdIn(memberIds).forEach(it -> counts.merge(((Number) it[0]).longValue(), ((Number) it[1]).longValue(), Long::sum));
        countByMaxIdIn(memberIds).forEach(it -> counts.merge(((Number) it[0]).longValue(), ((Number) it[1]).longValue(), Long::sum));
        return counts;
    }

    @Query("SELECT c.minId, COUNT(c) FROM CoworkerEntity c WHERE c.minId IN :memberIds GROUP BY c.minId")
    List<Object[]> countByMinIdIn(@Param("memberIds") Collection<Long> memberIds);

    @Query("SELECT c.maxId, COUNT(c) FROM CoworkerEntity c WHERE c.maxId IN :memberIds GROUP BY c.maxId")
    List<Object[]> countByMaxIdIn(@Param("memberIds") Collection<Long> memberIds);
}
