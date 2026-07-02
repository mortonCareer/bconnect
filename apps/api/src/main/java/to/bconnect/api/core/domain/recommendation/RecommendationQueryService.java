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
        return toDomain(recommendationRepository.findAllByToIdAndVisibleTrue(memberId), Side.FROM);
    }

    @Transactional(readOnly = true)
    public List<Recommendation> listSent(Long memberId) {
        return toDomain(recommendationRepository.findAllByFromIdAndVisibleTrue(memberId), Side.TO);
    }

    @Transactional(readOnly = true)
    public List<Recommendation> listMyReceived(AuthUser user) {
        return toDomain(recommendationRepository.findAllByToId(user.id()), Side.FROM);
    }

    @Transactional(readOnly = true)
    public List<Recommendation> listMySent(AuthUser user) {
        return toDomain(recommendationRepository.findAllByFromId(user.id()), Side.TO);
    }

    private List<Recommendation> toDomain(List<RecommendationEntity> entities, Side side) {
        return entities.stream()
                .map(it -> Recommendation.of(it, side == Side.FROM ? it.getFromId() : it.getToId()))
                .toList();
    }

    private enum Side { FROM, TO }
}
