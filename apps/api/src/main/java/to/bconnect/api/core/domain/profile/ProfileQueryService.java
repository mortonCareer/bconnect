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
        return toProfile(profile);
    }

    @Transactional(readOnly = true)
    public List<Profile> list() {
        return profileRepository.findAll().stream()
                .map(this::toProfile)
                .toList();
    }

    private Profile toProfile(ProfileEntity entity) {
        Long memberId = entity.getMemberId();
        return Profile.of(
                entity,
                postRepository.countByMemberId(memberId),
                recommendationRepository.countByToIdAndVisibleTrue(memberId),
                coworkerRepository.countByMemberId(memberId)
        );
    }
}
