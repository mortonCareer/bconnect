package to.bconnect.api.storage.recommendation;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.Collection;
import java.util.List;

public interface RecommendationRepository extends JpaRepository<RecommendationEntity, Long> {

    boolean existsByFromIdAndToId(Long fromId, Long toId);

    List<RecommendationEntity> findByToIdAndVisibleTrue(Long toId);

    List<RecommendationEntity> findByFromIdAndVisibleTrue(Long fromId);

    List<RecommendationEntity> findByToId(Long toId);

    List<RecommendationEntity> findByFromId(Long fromId);

    long countByToIdAndVisibleTrue(Long toId);

    @Query("SELECT r.toId, COUNT(r) FROM RecommendationEntity r WHERE r.visible = true AND r.toId IN :memberIds GROUP BY r.toId")
    List<Object[]> countByToIdInAndVisibleTrue(@Param("memberIds") Collection<Long> memberIds);
}
