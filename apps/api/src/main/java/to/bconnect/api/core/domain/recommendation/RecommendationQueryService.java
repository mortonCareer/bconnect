package to.bconnect.api.core.domain.recommendation;

import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import to.bconnect.api.security.AuthUser;
import to.bconnect.api.storage.recommendation.RecommendationEntity;
import to.bconnect.api.storage.recommendation.RecommendationRepository;

import java.util.List;

@Service
@RequiredArgsConstructor
public class RecommendationQueryService {

    private final RecommendationRepository recommendationRepository;

    @Transactional(readOnly = true)
    public List<Recommendation> listReceived(Long memberId) {
        return toDetails(recommendationRepository.findByToIdAndVisibleTrue(memberId), Side.FROM);
    }

    @Transactional(readOnly = true)
    public List<Recommendation> listSent(Long memberId) {
        return toDetails(recommendationRepository.findByFromIdAndVisibleTrue(memberId), Side.TO);
    }

    @Transactional(readOnly = true)
    public List<Recommendation> listMyReceived(AuthUser user) {
        return toDetails(recommendationRepository.findByToId(user.id()), Side.FROM);
    }

    @Transactional(readOnly = true)
    public List<Recommendation> listMySent(AuthUser user) {
        return toDetails(recommendationRepository.findByFromId(user.id()), Side.TO);
    }

    private List<Recommendation> toDetails(List<RecommendationEntity> entities, Side dir) {
        return entities.stream()
                .map(e -> Recommendation.of(e, dir == Side.FROM ? e.getFromId() : e.getToId()))
                .toList();
    }

    private enum Side { FROM, TO }
}
