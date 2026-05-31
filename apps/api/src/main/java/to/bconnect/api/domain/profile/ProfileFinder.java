package to.bconnect.api.domain.profile;

import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;
import to.bconnect.api.storage.domain.profile.ProfileRepository;
import to.bconnect.api.common.CodeException;
import to.bconnect.api.common.CommonExceptionCode;

import java.util.Collection;
import java.util.List;

@Component
@RequiredArgsConstructor
public class ProfileFinder {

    private final ProfileRepository profileRepository;


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
    public List<Profile> findByIds(List<Long> ids) {
        return profileRepository.findByIdIn(ids)
                .stream()
                .map(Profile::of)
                .toList();
    }

    @Transactional(readOnly = true)
    public Profile findByMemberId(Long memberId) {
        return profileRepository.findByMemberId(memberId)
                .map(Profile::of)
                .orElseThrow(() -> new CodeException(CommonExceptionCode.NOT_FOUND));
    }

    @Transactional(readOnly = true)
    public List<Profile> findAllByIds(Collection<Long> profileIds) {
        return profileRepository.findByIdIn(profileIds)
                .stream()
                .map(Profile::of)
                .toList();
    }

    @Transactional(readOnly = true)
    public boolean existsById(Long id) {
        return profileRepository.findById(id).isPresent();
    }

    @Transactional(readOnly = true)
    public boolean existsByMemberId(Long memberId) {
        return profileRepository.findByMemberId(memberId).isPresent();
    }
}
