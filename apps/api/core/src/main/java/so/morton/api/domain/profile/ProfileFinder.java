package so.morton.api.domain.profile;

import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Component;
import so.morton.api.storage.domain.profile.ProfileRepository;
import so.morton.api.support.CodeException;
import so.morton.api.support.CommonExceptionCode;

@Component
@RequiredArgsConstructor
public class ProfileFinder {

    private final ProfileRepository profileRepository;

    public Profile findByMemberId(Long memberId) {
        return profileRepository.findByMemberIdAndDeletedFalse(memberId)
                .map(Profile::of)
                .orElseThrow(() -> new CodeException(CommonExceptionCode.NOT_FOUND));
    }

    public Long resolveId(Long memberId) {
        return findByMemberId(memberId).id();
    }
}
