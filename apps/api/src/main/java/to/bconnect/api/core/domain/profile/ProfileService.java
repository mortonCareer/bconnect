package to.bconnect.api.core.domain.profile;

import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import to.bconnect.api.common.CodeException;
import to.bconnect.api.common.CommonExceptionCode;
import to.bconnect.api.core.presentation.v1.request.CreateProfileRequest;
import to.bconnect.api.core.presentation.v1.request.UpdateProfileRequest;
import to.bconnect.api.core.storage.coworker.CoworkerRepository;
import to.bconnect.api.core.storage.post.PostRepository;
import to.bconnect.api.core.storage.profile.ProfileEntity;
import to.bconnect.api.core.storage.profile.ProfileRepository;
import to.bconnect.api.core.storage.recommendation.RecommendationRepository;
import to.bconnect.api.security.AuthUser;
import to.bconnect.api.security.member.Member;
import to.bconnect.api.security.member.MemberFinder;

import java.util.List;
import java.util.Map;

@Service
@RequiredArgsConstructor
public class ProfileService {

    private final ProfileRepository profileRepository;
    private final ProfileFinder profileFinder;
    private final MemberFinder memberFinder;
    private final PostRepository postRepository;
    private final RecommendationRepository recommendationRepository;
    private final CoworkerRepository coworkerRepository;

    @Transactional(readOnly = true)
    public ProfileDetail get(Long profileId) {
        Profile profile = profileFinder.find(profileId);
        Member member = memberFinder.find(profile.memberId());
        return ProfileDetail.of(
                member,
                profile,
                (int) postRepository.countByProfileId(profileId),
                (int) recommendationRepository.countByToIdAndVisibleTrue(profileId),
                (int) coworkerRepository.countByProfileId(profileId)
        );
    }

    @Transactional(readOnly = true)
    public List<ProfileDetail> list() {
        List<Profile> profiles = profileFinder.findAll();
        List<Long> memberIds = profiles.stream().map(Profile::memberId).toList();
        Map<Long, Member> memberMap = memberFinder.resolveMap(memberIds);

        return profiles.stream()
                .map(profile -> ProfileDetail.of(
                        memberMap.get(profile.memberId()),
                        profile,
                        (int) postRepository.countByProfileId(profile.id()),
                        (int) recommendationRepository.countByToIdAndVisibleTrue(profile.id()),
                        (int) coworkerRepository.countByProfileId(profile.id())
                ))
                .toList();
    }

    @Transactional
    public Profile create(AuthUser authUser, CreateProfileRequest request) {
        if (profileRepository.existsByMemberId(authUser.id()))
            throw new CodeException(ProfileExceptionCode.ALREADY_EXISTS);

        if (!request.trades().contains(request.primaryTrade()))
            throw new CodeException(ProfileExceptionCode.INVALID_PRIMARY_TRADE);

        ProfileEntity profile = ProfileEntity.builder()
                .memberId(authUser.id())
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
    public void update(AuthUser authUser, UpdateProfileRequest request) {
        ProfileEntity found = profileRepository.findByMemberId(authUser.id())
                .orElseThrow(() -> new CodeException(CommonExceptionCode.NOT_FOUND));

        if (!found.getMemberId().equals(authUser.id()))
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
    public void updateAbout(AuthUser authUser, String about) {
        ProfileEntity found = profileRepository.findByMemberId(authUser.id())
                .orElseThrow(() -> new CodeException(CommonExceptionCode.NOT_FOUND));

        if (!found.getMemberId().equals(authUser.id()))
            throw new CodeException(CommonExceptionCode.FORBIDDEN);

        found.updateAbout(about);
    }

    @Transactional
    public void delete(AuthUser authUser) {
        profileRepository.findByMemberId(authUser.id()).ifPresent(found -> {
            if (!found.getMemberId().equals(authUser.id()))
                throw new CodeException(CommonExceptionCode.FORBIDDEN);

            profileRepository.delete(found);
        });
    }
}
