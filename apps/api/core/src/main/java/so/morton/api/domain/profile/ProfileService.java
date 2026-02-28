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
        if (profileFinder.existsByMemberId(memberId))
            throw new CodeException(ProfileExceptionCode.ALREADY_EXISTS);

        ProfileEntity profile = ProfileEntity.builder()
                .memberId(memberId)
                .primaryTrade(request.primaryTrade())
                .trades(request.trades())
                .experience(request.experience())
                .headline(request.headline())
                .about(request.about())
                .address(request.address())
                .build();

        ProfileEntity saved = profileRepository.save(profile);
        return Profile.of(saved);
    }

    @Transactional
    public void update(Long memberId, UpdateProfileRequest request) {
        ProfileEntity profile = profileRepository.findByMemberId(memberId)
                .orElseThrow(() -> new CodeException(CommonExceptionCode.NOT_FOUND));

        if (!profile.getMemberId().equals(memberId))
            throw new CodeException(CommonExceptionCode.FORBIDDEN);

        profile.update(
                request.primaryTrade(),
                request.trades(),
                request.experience(),
                request.headline(),
                request.address()
        );
    }

    @Transactional
    public void updateAbout(Long memberId, String about) {
        ProfileEntity profile = profileRepository.findByMemberId(memberId)
                .orElseThrow(() -> new CodeException(CommonExceptionCode.NOT_FOUND));

        if (!profile.getMemberId().equals(memberId))
            throw new CodeException(CommonExceptionCode.FORBIDDEN);

        profile.updateAbout(about);
    }

    @Transactional
    public void delete(Long memberId) {
        ProfileEntity profile = profileRepository.findByMemberId(memberId)
                .orElseThrow(() -> new CodeException(CommonExceptionCode.NOT_FOUND));

        if (!profile.getMemberId().equals(memberId))
            throw new CodeException(CommonExceptionCode.FORBIDDEN);

        profileRepository.delete(profile);
    }
}
