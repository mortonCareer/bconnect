package to.bconnect.api.core.domain.recommendation;

import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;
import to.bconnect.api.core.storage.recommendation.RecommendationRepository;

import java.util.List;

@Component
@RequiredArgsConstructor
public class RecommendationFinder {

    private final RecommendationRepository recommendationRepository;

    @Transactional(readOnly = true)
    public List<Recommendation> findAllReceived(Long memberId) {
        return recommendationRepository.findByToIdAndVisibleTrue(memberId)
                .stream().map(Recommendation::of).toList();
    }

    @Transactional(readOnly = true)
    public List<Recommendation> findAllSent(Long memberId) {
        return recommendationRepository.findByFromIdAndVisibleTrue(memberId)
                .stream().map(Recommendation::of).toList();
    }

    @Transactional(readOnly = true)
    public List<Recommendation> findAllMyReceived(Long memberId) {
        return recommendationRepository.findByToId(memberId)
                .stream().map(Recommendation::of).toList();
    }

    @Transactional(readOnly = true)
    public List<Recommendation> findAllMySent(Long memberId) {
        return recommendationRepository.findByFromId(memberId)
                .stream().map(Recommendation::of).toList();
    }
}
