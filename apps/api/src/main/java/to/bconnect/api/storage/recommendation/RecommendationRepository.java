package to.bconnect.api.storage.recommendation;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.Collection;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

public interface RecommendationRepository extends JpaRepository<RecommendationEntity, Long> {

    boolean existsByFromIdAndToId(Long fromId, Long toId);

    List<RecommendationEntity> findAllByToIdAndVisibleTrue(Long toId);

    List<RecommendationEntity> findAllByFromIdAndVisibleTrue(Long fromId);

    List<RecommendationEntity> findAllByToId(Long toId);

    List<RecommendationEntity> findAllByFromId(Long fromId);

    long countByToIdAndVisibleTrue(Long toId);

    default Map<Long, Long> countByToIdInAndVisibleTrue(Collection<Long> memberIds) {
        return countByToIdInAndVisibleTrueRows(memberIds).stream()
                .collect(Collectors.toMap(
                        it -> ((Number) it[0]).longValue(),
                        it -> ((Number) it[1]).longValue()
                ));
    }

    @Query("SELECT r.toId, COUNT(r) FROM RecommendationEntity r WHERE r.visible = true AND r.toId IN :memberIds GROUP BY r.toId")
    List<Object[]> countByToIdInAndVisibleTrueRows(@Param("memberIds") Collection<Long> memberIds);
}
