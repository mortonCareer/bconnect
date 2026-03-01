package so.morton.api.domain.profile;

import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;
import so.morton.api.storage.domain.profile.ProfileRepository;
import so.morton.api.support.CodeException;
import so.morton.api.support.CommonExceptionCode;

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
    public Profile findByMemberId(Long memberId) {
        return profileRepository.findByMemberId(memberId)
                .map(Profile::of)
                .orElseThrow(() -> new CodeException(CommonExceptionCode.NOT_FOUND));
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
