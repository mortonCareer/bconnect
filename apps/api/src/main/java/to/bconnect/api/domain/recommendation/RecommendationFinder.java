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
    public List<Recommendation> findAllReceived(Long profileId) {
        return recommendationRepository.findByToIdAndVisibleTrue(profileId)
                .stream().map(Recommendation::of).toList();
    }

    @Transactional(readOnly = true)
    public List<Recommendation> findAllSent(Long profileId) {
        return recommendationRepository.findByFromIdAndVisibleTrue(profileId)
                .stream().map(Recommendation::of).toList();
    }

    @Transactional(readOnly = true)
    public List<Recommendation> findAllMyReceived(Long profileId) {
        return recommendationRepository.findByToId(profileId)
                .stream().map(Recommendation::of).toList();
    }

    @Transactional(readOnly = true)
    public List<Recommendation> findAllMySent(Long profileId) {
        return recommendationRepository.findByFromId(profileId)
                .stream().map(Recommendation::of).toList();
    }
}
