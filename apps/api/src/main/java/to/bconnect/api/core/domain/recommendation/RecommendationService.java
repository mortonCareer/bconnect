package to.bconnect.api.core.domain.recommendation;

import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import to.bconnect.api.core.presentation.v1.request.CreateRecommendationRequest;
import to.bconnect.api.core.domain.coworker.CoworkerFinder;
import to.bconnect.api.security.member.Member;
import to.bconnect.api.core.domain.MemberResolver;
import to.bconnect.api.storage.recommendation.RecommendationEntity;
import to.bconnect.api.storage.recommendation.RecommendationRepository;
import to.bconnect.api.common.CodeException;
import to.bconnect.api.common.CommonExceptionCode;
import to.bconnect.api.security.AuthUser;

import java.util.List;
import java.util.Map;

@Service
@RequiredArgsConstructor
public class RecommendationService {

    private final RecommendationRepository recommendationRepository;
    private final RecommendationFinder recommendationFinder;
    private final MemberResolver memberResolver;
    private final CoworkerFinder coworkerFinder;

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

    @Transactional
    public Recommendation create(AuthUser user, CreateRecommendationRequest request) {
        Long fromId = user.id();
        Long toId = request.toId();

        if (fromId.equals(toId))
            throw new CodeException(RecommendationExceptionCode.SELF_RECOMMENDATION);
        if (!coworkerFinder.isCoworker(fromId, toId))
            throw new CodeException(RecommendationExceptionCode.NOT_COWORKER);
        if (recommendationRepository.existsByFromIdAndToId(fromId, toId))
            throw new CodeException(RecommendationExceptionCode.ALREADY_EXISTS);

        RecommendationEntity created = new RecommendationEntity(fromId, toId, request.content());
        recommendationRepository.save(created);

        // TODO: 알림 전송 (toId 회원에게)

        return Recommendation.of(created);
    }

    @Transactional
    public void update(AuthUser user, Long id, String content) {
        RecommendationEntity found = recommendationRepository.findById(id)
                .orElseThrow(() -> new CodeException(CommonExceptionCode.NOT_FOUND));

        if (!found.getFromId().equals(user.id()))
            throw new CodeException(CommonExceptionCode.FORBIDDEN);

        found.update(content);
    }

    @Transactional
    public void delete(AuthUser user, Long id) {
        recommendationRepository.findById(id).ifPresent(found -> {
            if (!found.getFromId().equals(user.id()))
                throw new CodeException(CommonExceptionCode.FORBIDDEN);

            recommendationRepository.delete(found);
        });
    }

    @Transactional
    public void hide(AuthUser user, Long id) {
        RecommendationEntity found = recommendationRepository.findById(id)
                .orElseThrow(() -> new CodeException(CommonExceptionCode.NOT_FOUND));

        if (!found.getToId().equals(user.id()))
            throw new CodeException(CommonExceptionCode.FORBIDDEN);

        found.hide();
    }

    @Transactional
    public void show(AuthUser user, Long id) {
        RecommendationEntity found = recommendationRepository.findById(id)
                .orElseThrow(() -> new CodeException(CommonExceptionCode.NOT_FOUND));

        if (!found.getToId().equals(user.id()))
            throw new CodeException(CommonExceptionCode.FORBIDDEN);

        found.show();
    }

    private List<RecommendationDetail> toDetails(List<Recommendation> recommendations, Side dir) {
        if (recommendations.isEmpty()) return List.of();

        List<Long> memberIds = recommendations.stream()
                .map(r -> dir == Side.FROM ? r.fromId() : r.toId())
                .toList();
        Map<Long, Member> memberMap = memberResolver.resolveMap(memberIds);

        return recommendations.stream()
                .map(r -> {
                    Long memberId = dir == Side.FROM ? r.fromId() : r.toId();
                    Member member = memberMap.get(memberId);
                    return RecommendationDetail.of(r, member);
                })
                .toList();
    }

    private enum Side { FROM, TO }
}
