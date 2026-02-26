package so.morton.api.domain.profile;

import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import so.morton.api.api.controller.v1.request.CreateProfileRequest;
import so.morton.api.api.controller.v1.request.UpdateProfileRequest;
import so.morton.api.storage.domain.profile.ProfileEntity;
import so.morton.api.storage.domain.profile.ProfileRepository;
import so.morton.api.support.CodeException;
import so.morton.api.support.CommonExceptionCode;

import java.util.List;

@Service
@RequiredArgsConstructor
public class ProfileService {

    private final ProfileRepository profileRepository;
    private final ProfileFinder profileFinder;

    @Transactional
    public Profile create(Long memberId, CreateProfileRequest request) {
        ProfileEntity entity = ProfileEntity.builder()
                .memberId(memberId)
                .primaryTrade(request.primaryTrade())
                .trades(request.trades())
                .experience(request.experience())
                .headline(request.headline())
                .about(request.about())
                .address(request.address())
                .build();

        ProfileEntity saved = profileRepository.save(entity);
        return Profile.of(saved);
    }

    @Transactional(readOnly = true)
    public Profile get(Long profileId) {
        return profileRepository.findByIdAndDeletedFalse(profileId)
                .map(Profile::of)
                .orElseThrow(() -> new CodeException(CommonExceptionCode.NOT_FOUND));
    }

    @Transactional(readOnly = true)
    public List<Profile> getAll() {
        return profileRepository.findAllByDeletedFalse()
                .stream()
                .map(Profile::of)
                .toList();
    }

    @Transactional
    public Profile update(Long memberId, UpdateProfileRequest request) {
        ProfileEntity entity = profileRepository.findByMemberIdAndDeletedFalse(memberId)
                .orElseThrow(() -> new CodeException(CommonExceptionCode.NOT_FOUND));

        entity.update(request.primaryTrade(), request.trades(), request.experience(),
                request.headline(), request.about(), request.address());

        return Profile.of(entity);
    }

    @Transactional
    public void delete(Long memberId) {
        ProfileEntity entity = profileRepository.findByMemberIdAndDeletedFalse(memberId)
                .orElseThrow(() -> new CodeException(CommonExceptionCode.NOT_FOUND));

        entity.delete();
    }
}
