package to.bconnect.api.core.domain.profile;

import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;
import to.bconnect.api.common.CodeException;
import to.bconnect.api.common.CommonExceptionCode;
import to.bconnect.api.core.storage.profile.ProfileRepository;

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
}
