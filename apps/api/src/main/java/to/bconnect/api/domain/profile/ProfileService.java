package to.bconnect.api.domain.profile;

import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import to.bconnect.api.presentation.v1.request.CreateProfileRequest;
import to.bconnect.api.presentation.v1.request.UpdateProfileRequest;
import to.bconnect.api.domain.coworker.CoworkerFinder;
import to.bconnect.api.security.member.Member;
import to.bconnect.api.security.member.MemberFinder;
import to.bconnect.api.domain.post.PostFinder;
import to.bconnect.api.domain.recommendation.RecommendationFinder;
import to.bconnect.api.storage.domain.profile.ProfileEntity;
import to.bconnect.api.storage.domain.profile.ProfileRepository;
import to.bconnect.api.common.CodeException;
import to.bconnect.api.common.CommonExceptionCode;
import to.bconnect.api.security.User;

import java.util.List;
import java.util.Map;
import java.util.function.Function;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class ProfileService {

    private final ProfileRepository profileRepository;
    private final ProfileFinder profileFinder;
    private final MemberFinder memberFinder;
    private final PostFinder postFinder;
    private final RecommendationFinder recommendationFinder;
    private final CoworkerFinder coworkerFinder;

    @Transactional(readOnly = true)
    public ProfileDetail get(Long profileId) {
        Profile profile = profileFinder.find(profileId);
        Member member = memberFinder.find(profile.memberId());
        return ProfileDetail.of(
                member,
                profile,
                (int) postFinder.countByProfileId(profileId),
                (int) recommendationFinder.countReceived(profileId),
                (int) coworkerFinder.countByProfileId(profileId)
        );
    }

    @Transactional(readOnly = true)
    public List<ProfileDetail> list() {
        List<Profile> profiles = profileFinder.findAll();

        Map<Long, Member> memberMap = memberFinder.findAllByIds(
                        profiles.stream().map(Profile::memberId).toList())
                .stream().collect(Collectors.toMap(Member::id, Function.identity()));

        return profiles.stream()
                .map(profile -> ProfileDetail.of(
                        memberMap.get(profile.memberId()),
                        profile,
                        (int) postFinder.countByProfileId(profile.id()),
                        (int) recommendationFinder.countReceived(profile.id()),
                        (int) coworkerFinder.countByProfileId(profile.id())
                ))
                .toList();
    }

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
        profileRepository.findByMemberId(user.id()).ifPresent(found -> {
            if (!found.getMemberId().equals(user.id()))
                throw new CodeException(CommonExceptionCode.FORBIDDEN);

            profileRepository.delete(found);
        });
    }
}
