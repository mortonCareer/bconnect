package to.bconnect.api.core.domain.profile;

import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;
import to.bconnect.api.common.CodeException;
import to.bconnect.api.common.CommonExceptionCode;
import to.bconnect.api.storage.profile.ProfileEntity;
import to.bconnect.api.storage.profile.ProfileRepository;

import java.util.Collection;
import java.util.Map;
import java.util.stream.Collectors;

@Component
@RequiredArgsConstructor
public class ProfileResolver {

    private final ProfileRepository profileRepository;

    @Transactional(readOnly = true)
    public Profile get(Long memberId) {
        return profileRepository.findByMemberId(memberId)
                .map(Profile::of)
                .orElseThrow(() -> new CodeException(CommonExceptionCode.NOT_FOUND));
    }

    @Transactional(readOnly = true)
    public Map<Long, Profile> resolveMap(Collection<Long> memberIds) {
        return profileRepository.findAllByMemberIdIn(memberIds).stream()
                .collect(Collectors.toMap(
                        ProfileEntity::getMemberId,
                        Profile::of
                ));
    }
}
