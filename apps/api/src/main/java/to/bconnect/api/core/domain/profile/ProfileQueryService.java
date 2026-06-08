package to.bconnect.api.core.domain.profile;

import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import to.bconnect.api.common.CodeException;
import to.bconnect.api.common.CommonExceptionCode;
import to.bconnect.api.core.domain.MemberResolver;
import to.bconnect.api.security.member.Member;
import to.bconnect.api.storage.coworker.CoworkerRepository;
import to.bconnect.api.storage.post.PostRepository;
import to.bconnect.api.storage.profile.ProfileEntity;
import to.bconnect.api.storage.profile.ProfileRepository;
import to.bconnect.api.storage.recommendation.RecommendationRepository;

import java.util.List;
import java.util.Map;

@Service
@RequiredArgsConstructor
public class ProfileQueryService {

    private final ProfileRepository profileRepository;
    private final MemberResolver memberResolver;
    private final PostRepository postRepository;
    private final RecommendationRepository recommendationRepository;
    private final CoworkerRepository coworkerRepository;

    @Transactional(readOnly = true)
    public Profile get(Long memberId) {
        Member member = memberResolver.find(memberId);
        ProfileEntity profile = profileRepository.findByMemberId(memberId)
                .orElseThrow(() -> new CodeException(CommonExceptionCode.NOT_FOUND));

        return toProfile(
                profile,
                member,
                postRepository.countByMemberId(memberId),
                recommendationRepository.countByToIdAndVisibleTrue(memberId),
                coworkerRepository.countByMemberId(memberId)
        );
    }

    @Transactional(readOnly = true)
    public List<Profile> list() {
        List<ProfileEntity> profiles = profileRepository.findAll();
        List<Long> memberIds = profiles.stream().map(ProfileEntity::getMemberId).toList();
        Map<Long, Member> memberMap = memberResolver.map(memberIds);

        return profiles.stream()
                .map(profile -> toProfile(
                        profile,
                        memberMap.get(profile.getMemberId()),
                        postRepository.countByMemberId(profile.getMemberId()),
                        recommendationRepository.countByToIdAndVisibleTrue(profile.getMemberId()),
                        coworkerRepository.countByMemberId(profile.getMemberId())
                ))
                .toList();
    }

    private Profile toProfile(ProfileEntity entity, Member member, Long postCount, Long recommendationCount, Long coworkerCount) {
        return new Profile(
                entity.getId(),
                member,
                entity.getPrimaryTrade(),
                entity.getTrades(),
                entity.getExperience(),
                entity.getHeadline(),
                entity.getAbout(),
                entity.getAddress(),
                entity.getCreatedAt(),
                entity.getModifiedAt(),
                postCount,
                recommendationCount,
                coworkerCount
        );
    }
}
