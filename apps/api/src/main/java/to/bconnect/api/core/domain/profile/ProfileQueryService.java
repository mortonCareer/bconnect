package to.bconnect.api.core.domain.profile;

import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import to.bconnect.api.common.CodeException;
import to.bconnect.api.common.CommonExceptionCode;
import to.bconnect.api.storage.coworker.CoworkerRepository;
import to.bconnect.api.storage.post.PostRepository;
import to.bconnect.api.storage.profile.ProfileEntity;
import to.bconnect.api.storage.profile.ProfileRepository;
import to.bconnect.api.storage.recommendation.RecommendationRepository;

import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class ProfileQueryService {

    private final ProfileRepository profileRepository;
    private final PostRepository postRepository;
    private final RecommendationRepository recommendationRepository;
    private final CoworkerRepository coworkerRepository;

    @Transactional(readOnly = true)
    public Profile get(Long memberId) {
        ProfileEntity profile = profileRepository.findByMemberId(memberId)
                .orElseThrow(() -> new CodeException(CommonExceptionCode.NOT_FOUND));
        return Profile.of(
                profile,
                postRepository.countByMemberId(memberId),
                recommendationRepository.countByToIdAndVisibleTrue(memberId),
                coworkerRepository.countByMemberId(memberId)
        );
    }

    @Transactional(readOnly = true)
    public List<Profile> list() {
        List<ProfileEntity> profiles = profileRepository.findAll();
        if (profiles.isEmpty()) return List.of();

        List<Long> memberIds = profiles.stream().map(ProfileEntity::getMemberId).toList();

        Map<Long, Long> postCounts = toCountMap(postRepository.countByMemberIdIn(memberIds));
        Map<Long, Long> recommendationCounts = toCountMap(recommendationRepository.countByToIdInAndVisibleTrue(memberIds));
        Map<Long, Long> coworkerCounts = toCountMap(coworkerRepository.countByMemberIdIn(memberIds));

        return profiles.stream()
                .map(entity -> Profile.of(
                        entity,
                        postCounts.getOrDefault(entity.getMemberId(), 0L),
                        recommendationCounts.getOrDefault(entity.getMemberId(), 0L),
                        coworkerCounts.getOrDefault(entity.getMemberId(), 0L)
                ))
                .toList();
    }

    private Map<Long, Long> toCountMap(List<Object[]> rows) {
        return rows.stream().collect(Collectors.toMap(
                row -> ((Number) row[0]).longValue(),
                row -> ((Number) row[1]).longValue()
        ));
    }
}
