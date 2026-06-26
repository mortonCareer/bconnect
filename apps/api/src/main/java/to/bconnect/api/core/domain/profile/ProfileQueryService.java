package to.bconnect.api.core.domain.profile;

import lombok.RequiredArgsConstructor;
import lombok.val;
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
        val profile = profileRepository.findByMemberId(memberId)
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
        val profiles = profileRepository.findAll();
        if (profiles.isEmpty()) return List.of();

        val memberIds = profiles.stream().map(ProfileEntity::getMemberId).toList();

        val postCounts = toCountMap(postRepository.countByMemberIdIn(memberIds));
        val recommendationCounts = toCountMap(recommendationRepository.countByToIdInAndVisibleTrue(memberIds));
        val coworkerCounts = coworkerRepository.countByMemberIdIn(memberIds);

        return profiles.stream()
                .map(it -> Profile.of(
                        it,
                        postCounts.getOrDefault(it.getMemberId(), 0L),
                        recommendationCounts.getOrDefault(it.getMemberId(), 0L),
                        coworkerCounts.getOrDefault(it.getMemberId(), 0L)
                ))
                .toList();
    }

    private Map<Long, Long> toCountMap(List<Object[]> rows) {
        return rows.stream().collect(Collectors.toMap(
                it -> ((Number) it[0]).longValue(),
                it -> ((Number) it[1]).longValue()
        ));
    }
}
