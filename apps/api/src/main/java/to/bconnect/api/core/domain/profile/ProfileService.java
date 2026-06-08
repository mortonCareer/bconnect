package to.bconnect.api.core.domain.profile;

import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import to.bconnect.api.common.CodeException;
import to.bconnect.api.common.CommonExceptionCode;
import to.bconnect.api.core.presentation.v1.request.CreateProfileRequest;
import to.bconnect.api.core.presentation.v1.request.UpdateProfileRequest;
import to.bconnect.api.storage.coworker.CoworkerRepository;
import to.bconnect.api.storage.post.PostRepository;
import to.bconnect.api.storage.profile.ProfileEntity;
import to.bconnect.api.storage.profile.ProfileRepository;
import to.bconnect.api.storage.recommendation.RecommendationRepository;
import to.bconnect.api.security.AuthUser;
import to.bconnect.api.security.member.Member;
import to.bconnect.api.core.domain.MemberResolver;

import java.util.List;
import java.util.Map;

@Service
@RequiredArgsConstructor
public class ProfileService {

    private final ProfileRepository profileRepository;
    private final ProfileFinder profileFinder;
    private final MemberResolver memberResolver;
    private final PostRepository postRepository;
    private final RecommendationRepository recommendationRepository;
    private final CoworkerRepository coworkerRepository;

    @Transactional(readOnly = true)
    public ProfileDetail get(Long profileId) {
        Profile profile = profileFinder.find(profileId);
        Member member = memberResolver.find(profile.memberId());
        return ProfileDetail.of(
                member,
                profile,
                (int) postRepository.countByMemberId(profile.memberId()),
                (int) recommendationRepository.countByToIdAndVisibleTrue(profile.memberId()),
                (int) coworkerRepository.countByMemberId(profile.memberId())
        );
    }

    @Transactional(readOnly = true)
    public List<ProfileDetail> list() {
        List<Profile> profiles = profileFinder.findAll();
        List<Long> memberIds = profiles.stream().map(Profile::memberId).toList();
        Map<Long, Member> memberMap = memberResolver.resolveMap(memberIds);

        return profiles.stream()
                .map(profile -> ProfileDetail.of(
                        memberMap.get(profile.memberId()),
                        profile,
                        (int) postRepository.countByMemberId(profile.memberId()),
                        (int) recommendationRepository.countByToIdAndVisibleTrue(profile.memberId()),
                        (int) coworkerRepository.countByMemberId(profile.memberId())
                ))
                .toList();
    }

    @Transactional
    public Profile create(AuthUser user, CreateProfileRequest request) {
        if (profileRepository.existsByMemberId(user.id()))
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
    public void update(AuthUser user, UpdateProfileRequest request) {
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
    public void updateAbout(AuthUser user, String about) {
        ProfileEntity found = profileRepository.findByMemberId(user.id())
                .orElseThrow(() -> new CodeException(CommonExceptionCode.NOT_FOUND));

        if (!found.getMemberId().equals(user.id()))
            throw new CodeException(CommonExceptionCode.FORBIDDEN);

        found.updateAbout(about);
    }

    @Transactional
    public void delete(AuthUser user) {
        profileRepository.findByMemberId(user.id()).ifPresent(found -> {
            if (!found.getMemberId().equals(user.id()))
                throw new CodeException(CommonExceptionCode.FORBIDDEN);

            profileRepository.delete(found);
        });
    }
}
