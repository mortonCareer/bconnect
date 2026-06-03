package to.bconnect.api.domain.recommendation;

import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;
import to.bconnect.api.storage.domain.recommendation.RecommendationRepository;

import java.util.List;

@Component
@RequiredArgsConstructor
public class RecommendationFinder {

    private final RecommendationRepository recommendationRepository;

    @Transactional(readOnly = true)
    public List<Recommendation> findReceived(Long profileId) {
        return recommendationRepository.findByToIdAndVisibleTrue(profileId)
                .stream().map(Recommendation::of).toList();
    }

    @Transactional(readOnly = true)
    public List<Recommendation> findSent(Long profileId) {
        return recommendationRepository.findByFromIdAndVisibleTrue(profileId)
                .stream().map(Recommendation::of).toList();
    }

    @Transactional(readOnly = true)
    public List<Recommendation> findMyReceived(Long profileId) {
        return recommendationRepository.findByToId(profileId)
                .stream().map(Recommendation::of).toList();
    }

    @Transactional(readOnly = true)
    public List<Recommendation> findMySent(Long profileId) {
        return recommendationRepository.findByFromId(profileId)
                .stream().map(Recommendation::of).toList();
    }
}
