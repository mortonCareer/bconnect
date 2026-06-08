package to.bconnect.api.core.domain.recommendation;

import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import to.bconnect.api.core.domain.MemberResolver;
import to.bconnect.api.security.AuthUser;
import to.bconnect.api.security.member.Member;

import java.util.List;
import java.util.Map;

@Service
@RequiredArgsConstructor
public class RecommendationQueryService {

    private final RecommendationFinder recommendationFinder;
    private final MemberResolver memberResolver;

    @Transactional(readOnly = true)
    public List<RecommendationDetail> listReceived(Long memberId) {
        return toDetails(recommendationFinder.findAllReceived(memberId), Side.FROM);
    }

    @Transactional(readOnly = true)
    public List<RecommendationDetail> listSent(Long memberId) {
        return toDetails(recommendationFinder.findAllSent(memberId), Side.TO);
    }

    @Transactional(readOnly = true)
    public List<RecommendationDetail> listMyReceived(AuthUser user) {
        return toDetails(recommendationFinder.findAllMyReceived(user.id()), Side.FROM);
    }

    @Transactional(readOnly = true)
    public List<RecommendationDetail> listMySent(AuthUser user) {
        return toDetails(recommendationFinder.findAllMySent(user.id()), Side.TO);
    }

    private List<RecommendationDetail> toDetails(List<Recommendation> recommendations, Side dir) {
        if (recommendations.isEmpty()) return List.of();

        List<Long> memberIds = recommendations.stream()
                .map(r -> dir == Side.FROM ? r.fromId() : r.toId())
                .toList();
        Map<Long, Member> memberMap = memberResolver.map(memberIds);

        return recommendations.stream()
                .map(r -> {
                    Long memberId = dir == Side.FROM ? r.fromId() : r.toId();
                    Member member = memberMap.get(memberId);
                    return new RecommendationDetail(
                            r.id(),
                            member,
                            r.content(),
                            r.visible(),
                            r.createdAt(),
                            r.modifiedAt()
                    );
                })
                .toList();
    }

    private enum Side { FROM, TO }
}
