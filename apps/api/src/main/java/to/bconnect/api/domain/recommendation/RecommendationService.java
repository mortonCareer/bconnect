package to.bconnect.api.domain.recommendation;

import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import to.bconnect.api.presentation.v1.request.CreateRecommendationRequest;
import to.bconnect.api.domain.coworker.CoworkerFinder;
import to.bconnect.api.security.member.Member;
import to.bconnect.api.security.member.MemberFinder;
import to.bconnect.api.domain.profile.Profile;
import to.bconnect.api.domain.profile.ProfileFinder;
import to.bconnect.api.storage.domain.recommendation.RecommendationEntity;
import to.bconnect.api.storage.domain.recommendation.RecommendationRepository;
import to.bconnect.api.common.CodeException;
import to.bconnect.api.common.CommonExceptionCode;
import to.bconnect.api.security.User;

import java.util.List;
import java.util.Map;
import java.util.function.Function;
import java.util.stream.Collectors;

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
    public List<RecommendationDetail> listMyReceived(User user) {
        Profile me = profileFinder.findByMemberId(user.id());
        return toDetails(recommendationFinder.findAllMyReceived(me.id()), Side.FROM);
    }

    @Transactional(readOnly = true)
    public List<RecommendationDetail> listMySent(User user) {
        Profile me = profileFinder.findByMemberId(user.id());
        return toDetails(recommendationFinder.findAllMySent(me.id()), Side.TO);
    }

    @Transactional
    public Recommendation create(User user, CreateRecommendationRequest request) {
        Profile fromProfile = profileFinder.findByMemberId(user.id());
        Long fromId = fromProfile.id();
        Long toId = request.toId();

        if (fromId.equals(toId))
            throw new CodeException(RecommendationExceptionCode.SELF_RECOMMENDATION);
        if (!coworkerFinder.isCoworker(fromId, toId))
            throw new CodeException(RecommendationExceptionCode.NOT_COWORKER);
        if (recommendationRepository.existsByFromIdAndToId(fromId, toId))
            throw new CodeException(RecommendationExceptionCode.ALREADY_EXISTS);

        RecommendationEntity persisted = recommendationRepository.save(
                new RecommendationEntity(fromId, toId, request.content())
        );

        // TODO: 알림 전송 (toId 프로필 소유자에게)

        return Recommendation.of(persisted);
    }

    @Transactional
    public void update(User user, Long id, String content) {
        Profile profile = profileFinder.findByMemberId(user.id());
        RecommendationEntity found = recommendationRepository.findById(id)
                .orElseThrow(() -> new CodeException(CommonExceptionCode.NOT_FOUND));

        if (!found.getFromId().equals(profile.id()))
            throw new CodeException(CommonExceptionCode.FORBIDDEN);

        found.update(content);
    }

    @Transactional
    public void delete(User user, Long id) {
        Profile profile = profileFinder.findByMemberId(user.id());
        recommendationRepository.findById(id).ifPresent(found -> {
            if (!found.getFromId().equals(profile.id()))
                throw new CodeException(CommonExceptionCode.FORBIDDEN);

            recommendationRepository.delete(found);
        });
    }

    @Transactional
    public void hide(User user, Long id) {
        Profile profile = profileFinder.findByMemberId(user.id());
        RecommendationEntity found = recommendationRepository.findById(id)
                .orElseThrow(() -> new CodeException(CommonExceptionCode.NOT_FOUND));

        if (!found.getToId().equals(profile.id()))
            throw new CodeException(CommonExceptionCode.FORBIDDEN);

        found.hide();
    }

    @Transactional
    public void show(User user, Long id) {
        Profile profile = profileFinder.findByMemberId(user.id());
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

        Map<Long, Profile> profileMap = profileFinder.findAllByIds(profileIds).stream()
                .collect(Collectors.toMap(Profile::id, Function.identity()));

        List<Long> memberIds = profileMap.values().stream()
                .map(Profile::memberId)
                .toList();

        Map<Long, Member> memberMap = memberFinder.findAllByIds(memberIds).stream()
                .collect(Collectors.toMap(Member::id, Function.identity()));

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
