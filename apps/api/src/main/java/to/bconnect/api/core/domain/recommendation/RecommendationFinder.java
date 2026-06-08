package to.bconnect.api.core.domain.recommendation;

import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;
import to.bconnect.api.storage.recommendation.RecommendationEntity;
import to.bconnect.api.storage.recommendation.RecommendationRepository;

import java.util.List;

@Component
@RequiredArgsConstructor
public class RecommendationFinder {

    private final RecommendationRepository recommendationRepository;

    @Transactional(readOnly = true)
    public List<Recommendation> findAllReceived(Long memberId) {
        return recommendationRepository.findByToIdAndVisibleTrue(memberId)
                .stream().map(this::toRecommendation).toList();
    }

    @Transactional(readOnly = true)
    public List<Recommendation> findAllSent(Long memberId) {
        return recommendationRepository.findByFromIdAndVisibleTrue(memberId)
                .stream().map(this::toRecommendation).toList();
    }

    @Transactional(readOnly = true)
    public List<Recommendation> findAllMyReceived(Long memberId) {
        return recommendationRepository.findByToId(memberId)
                .stream().map(this::toRecommendation).toList();
    }

    @Transactional(readOnly = true)
    public List<Recommendation> findAllMySent(Long memberId) {
        return recommendationRepository.findByFromId(memberId)
                .stream().map(this::toRecommendation).toList();
    }

    private Recommendation toRecommendation(RecommendationEntity entity) {
        return new Recommendation(
                entity.getId(),
                entity.getFromId(),
                entity.getToId(),
                entity.getContent(),
                entity.isVisible(),
                entity.getCreatedAt(),
                entity.getModifiedAt()
        );
    }
}
