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
import so.morton.api.support.auth.User;
import java.util.List;

@Service
@RequiredArgsConstructor
public class ProfileService {

    private final ProfileRepository profileRepository;
    private final ProfileFinder profileFinder;

    @Transactional
    public Profile create(User user, CreateProfileRequest request) {
        if (profileFinder.existsByMemberId(user.id()))
            throw new CodeException(ProfileExceptionCode.ALREADY_EXISTS);

        ProfileEntity profile = ProfileEntity.builder()
                .memberId(user.id())
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
    public void update(User user, UpdateProfileRequest request) {
        ProfileEntity profile = profileRepository.findByMemberId(user.id())
                .orElseThrow(() -> new CodeException(CommonExceptionCode.NOT_FOUND));

        if (!profile.getMemberId().equals(user.id()))
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
    public void updateAbout(User user, String about) {
        ProfileEntity profile = profileRepository.findByMemberId(user.id())
                .orElseThrow(() -> new CodeException(CommonExceptionCode.NOT_FOUND));

        if (!profile.getMemberId().equals(user.id()))
            throw new CodeException(CommonExceptionCode.FORBIDDEN);

        profile.updateAbout(about);
    }

    @Transactional
    public void delete(User user) {
        ProfileEntity profile = profileRepository.findByMemberId(user.id())
                .orElseThrow(() -> new CodeException(CommonExceptionCode.NOT_FOUND));

        if (!profile.getMemberId().equals(user.id()))
            throw new CodeException(CommonExceptionCode.FORBIDDEN);

        profileRepository.delete(profile);
    }
}
