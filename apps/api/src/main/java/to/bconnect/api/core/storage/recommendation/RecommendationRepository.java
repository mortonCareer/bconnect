package to.bconnect.api.core.storage.recommendation;

import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface RecommendationRepository extends JpaRepository<RecommendationEntity, Long> {

    boolean existsByFromIdAndToId(Long fromId, Long toId);

    List<RecommendationEntity> findByToIdAndVisibleTrue(Long toId);

    List<RecommendationEntity> findByFromIdAndVisibleTrue(Long fromId);

    List<RecommendationEntity> findByToId(Long toId);

    List<RecommendationEntity> findByFromId(Long fromId);

    long countByToIdAndVisibleTrue(Long toId);
}
