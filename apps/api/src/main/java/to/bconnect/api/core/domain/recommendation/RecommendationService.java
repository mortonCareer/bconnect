package to.bconnect.api.core.domain.recommendation;

import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import to.bconnect.api.core.presentation.v1.request.CreateRecommendationRequest;
import to.bconnect.api.core.domain.coworker.CoworkerFinder;
import to.bconnect.api.security.member.Member;
import to.bconnect.api.security.member.MemberFinder;
import to.bconnect.api.core.domain.profile.Profile;
import to.bconnect.api.core.domain.profile.ProfileFinder;
import to.bconnect.api.core.storage.recommendation.RecommendationEntity;
import to.bconnect.api.core.storage.recommendation.RecommendationRepository;
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
    private final ProfileFinder profileFinder;
    private final MemberFinder memberFinder;
    private final CoworkerFinder coworkerFinder;

    @Transactional(readOnly = true)
    public List<RecommendationDetail> listReceived(Long profileId) {
        return toDetails(recommendationFinder.findAllReceived(profileId), Side.FROM);
    }

    @Transactional(readOnly = true)
    public List<RecommendationDetail> listSent(Long profileId) {
        return toDetails(recommendationFinder.findAllSent(profileId), Side.TO);
    }

    @Transactional(readOnly = true)
    public List<RecommendationDetail> listMyReceived(AuthUser authUser) {
        Profile me = profileFinder.findByMemberId(authUser.id());
        return toDetails(recommendationFinder.findAllMyReceived(me.id()), Side.FROM);
    }

    @Transactional(readOnly = true)
    public List<RecommendationDetail> listMySent(AuthUser authUser) {
        Profile me = profileFinder.findByMemberId(authUser.id());
        return toDetails(recommendationFinder.findAllMySent(me.id()), Side.TO);
    }

    @Transactional
    public Recommendation create(AuthUser authUser, CreateRecommendationRequest request) {
        Profile fromProfile = profileFinder.findByMemberId(authUser.id());
        Long fromId = fromProfile.id();
        Long toId = request.toId();

        if (fromId.equals(toId))
            throw new CodeException(RecommendationExceptionCode.SELF_RECOMMENDATION);
        if (!coworkerFinder.isCoworker(fromId, toId))
            throw new CodeException(RecommendationExceptionCode.NOT_COWORKER);
        if (recommendationRepository.existsByFromIdAndToId(fromId, toId))
            throw new CodeException(RecommendationExceptionCode.ALREADY_EXISTS);

        RecommendationEntity created = new RecommendationEntity(fromId, toId, request.content());
        recommendationRepository.save(created);

        // TODO: 알림 전송 (toId 프로필 소유자에게)

        return Recommendation.of(created);
    }

    @Transactional
    public void update(AuthUser authUser, Long id, String content) {
        Profile profile = profileFinder.findByMemberId(authUser.id());
        RecommendationEntity found = recommendationRepository.findById(id)
                .orElseThrow(() -> new CodeException(CommonExceptionCode.NOT_FOUND));

        if (!found.getFromId().equals(profile.id()))
            throw new CodeException(CommonExceptionCode.FORBIDDEN);

        found.update(content);
    }

    @Transactional
    public void delete(AuthUser authUser, Long id) {
        Profile profile = profileFinder.findByMemberId(authUser.id());
        recommendationRepository.findById(id).ifPresent(found -> {
            if (!found.getFromId().equals(profile.id()))
                throw new CodeException(CommonExceptionCode.FORBIDDEN);

            recommendationRepository.delete(found);
        });
    }

    @Transactional
    public void hide(AuthUser authUser, Long id) {
        Profile profile = profileFinder.findByMemberId(authUser.id());
        RecommendationEntity found = recommendationRepository.findById(id)
                .orElseThrow(() -> new CodeException(CommonExceptionCode.NOT_FOUND));

        if (!found.getToId().equals(profile.id()))
            throw new CodeException(CommonExceptionCode.FORBIDDEN);

        found.hide();
    }

    @Transactional
    public void show(AuthUser authUser, Long id) {
        Profile profile = profileFinder.findByMemberId(authUser.id());
        RecommendationEntity found = recommendationRepository.findById(id)
                .orElseThrow(() -> new CodeException(CommonExceptionCode.NOT_FOUND));

        if (!found.getToId().equals(profile.id()))
            throw new CodeException(CommonExceptionCode.FORBIDDEN);

        found.show();
    }

    private List<RecommendationDetail> toDetails(List<Recommendation> recommendations, Side counterpart) {
        if (recommendations.isEmpty()) return List.of();

        List<Long> profileIds = recommendations.stream()
                .map(r -> counterpart == Side.FROM ? r.fromId() : r.toId())
                .toList();
        Map<Long, Profile> profileMap = profileFinder.resolveMapByMemberId(profileIds);
        List<Long> memberIds = profileFinder.resolveMemberIdsIn(profileIds);
        Map<Long, Member> memberMap = memberFinder.resolveMap(memberIds);

        return recommendations.stream()
                .map(r -> {
                    Long pid = counterpart == Side.FROM ? r.fromId() : r.toId();
                    Profile profile = profileMap.get(pid);
                    Member member = memberMap.get(profile.memberId());
                    return RecommendationDetail.of(r, member, profile);
                })
                .toList();
    }

    private enum Side { FROM, TO }
}
