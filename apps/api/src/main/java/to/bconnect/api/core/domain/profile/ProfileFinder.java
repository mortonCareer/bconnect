package to.bconnect.api.core.domain.profile;

import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;
import to.bconnect.api.common.CodeException;
import to.bconnect.api.common.CommonExceptionCode;
import to.bconnect.api.core.storage.profile.ProfileEntity;
import to.bconnect.api.core.storage.profile.ProfileRepository;

import java.util.Collection;
import java.util.List;
import java.util.Map;
import java.util.function.Function;
import java.util.stream.Collectors;

@Component
@RequiredArgsConstructor
public class ProfileFinder {

    private final ProfileRepository profileRepository;

    @Transactional(readOnly = true)
    public Map<Long, Profile> resolveMapByMemberId(Collection<Long> profileIds) {
        return profileRepository.findByIdIn(profileIds)
                .stream()
                .map(Profile::of)
                .collect(Collectors.toMap(Profile::memberId, Function.identity()));
    }

    @Transactional(readOnly = true)
    public List<Long> resolveMemberIdsIn(Collection<Long> profileIds) {
        return profileRepository.findByIdIn(profileIds)
                .stream()
                .map(ProfileEntity::getMemberId)
                .toList();
    }

    @Transactional(readOnly = true)
    public List<Profile> findAll() {
        return profileRepository.findAll()
                .stream()
                .map(Profile::of)
                .toList();
    }

    @Transactional(readOnly = true)
    public Profile find(Long id) {
        return profileRepository.findById(id)
                .map(Profile::of)
                .orElseThrow(() -> new CodeException(CommonExceptionCode.NOT_FOUND));
    }

    @Transactional(readOnly = true)
    public Profile findByMemberId(Long memberId) {
        return profileRepository.findByMemberId(memberId)
                .map(Profile::of)
                .orElseThrow(() -> new CodeException(CommonExceptionCode.NOT_FOUND));
    }
}
