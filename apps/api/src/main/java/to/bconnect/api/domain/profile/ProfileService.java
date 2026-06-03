package to.bconnect.api.domain.profile;

import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import to.bconnect.api.api.controller.v1.request.CreateProfileRequest;
import to.bconnect.api.api.controller.v1.request.UpdateProfileRequest;
import to.bconnect.api.storage.domain.profile.ProfileEntity;
import to.bconnect.api.storage.domain.profile.ProfileRepository;
import to.bconnect.api.common.CodeException;
import to.bconnect.api.common.CommonExceptionCode;
import to.bconnect.api.support.security.User;

@Service
@RequiredArgsConstructor
public class ProfileService {

    private final ProfileRepository profileRepository;
    private final ProfileFinder profileFinder;

    @Transactional
    public Profile create(User user, CreateProfileRequest request) {
        if (profileFinder.existsByMemberId(user.id()))
            throw new CodeException(ProfileExceptionCode.ALREADY_EXISTS);

        if (!request.trades().contains(request.primaryTrade()))
            throw new CodeException(ProfileExceptionCode.INVALID_PRIMARY_TRADE);

        ProfileEntity profile = ProfileEntity.builder()
                .memberId(user.id())
                .primaryTrade(request.primaryTrade())
                .trades(request.trades())
                .experience(request.experience())
                .headline(request.headline())
                .about(request.about())
                .address(request.address())
                .build();

        profileRepository.save(profile);
        return Profile.of(profile);
    }

    @Transactional
    public void update(User user, UpdateProfileRequest request) {
        ProfileEntity found = profileRepository.findByMemberId(user.id())
                .orElseThrow(() -> new CodeException(CommonExceptionCode.NOT_FOUND));

        if (!found.getMemberId().equals(user.id()))
            throw new CodeException(CommonExceptionCode.FORBIDDEN);

        if (!request.trades().contains(request.primaryTrade()))
            throw new CodeException(ProfileExceptionCode.INVALID_PRIMARY_TRADE);

        found.update(
                request.primaryTrade(),
                request.trades(),
                request.experience(),
                request.headline(),
                request.address()
        );
    }

    @Transactional
    public void updateAbout(User user, String about) {
        ProfileEntity found = profileRepository.findByMemberId(user.id())
                .orElseThrow(() -> new CodeException(CommonExceptionCode.NOT_FOUND));

        if (!found.getMemberId().equals(user.id()))
            throw new CodeException(CommonExceptionCode.FORBIDDEN);

        found.updateAbout(about);
    }

    @Transactional
    public void delete(User user) {
        ProfileEntity found = profileRepository.findByMemberId(user.id())
                .orElseThrow(() -> new CodeException(CommonExceptionCode.NOT_FOUND));

        if (!found.getMemberId().equals(user.id()))
            throw new CodeException(CommonExceptionCode.FORBIDDEN);

        profileRepository.delete(found);
    }
}
