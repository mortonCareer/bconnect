package to.bconnect.api.core.domain.coworker;

import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import to.bconnect.api.security.member.Member;
import to.bconnect.api.core.domain.profile.Profile;
import to.bconnect.api.core.domain.profile.ProfileFinder;
import to.bconnect.api.core.storage.coworker.CoworkerEntity;
import to.bconnect.api.core.storage.coworker.CoworkerRepository;
import to.bconnect.api.core.storage.coworker.CoworkerRequestEntity;
import to.bconnect.api.core.storage.coworker.CoworkerRequestRepository;
import to.bconnect.api.core.storage.member.MemberRepository;
import to.bconnect.api.core.storage.profile.ProfileRepository;
import to.bconnect.api.common.CodeException;
import to.bconnect.api.common.CommonExceptionCode;
import to.bconnect.api.security.AuthUser;

import java.util.List;
import java.util.Map;
import java.util.function.Function;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class CoworkerRequestService {

    private final CoworkerRepository coworkerRepository;
    private final CoworkerRequestRepository requestRepository;
    private final ProfileFinder profileFinder;
    private final ProfileRepository profileRepository;
    private final MemberRepository memberRepository;

    @Transactional
    public CoworkerRequest create(AuthUser authUser, Long targetId) {
        Profile profile = profileFinder.findByMemberId(authUser.id());
        Long profileId = profile.id();

        if (profileId.equals(targetId))
            throw new CodeException(CoworkerExceptionCode.SELF_REQUEST);
        if (!profileRepository.existsById(targetId))
            throw new CodeException(CoworkerExceptionCode.TARGET_NOT_FOUND);
        if (coworkerRepository.existsByMinIdAndMaxId(Math.min(profileId, targetId), Math.max(profileId, targetId)))
            throw new CodeException(CoworkerExceptionCode.ALREADY_COWORKER);
        if (requestRepository.findByFromIdAndToId(profileId, targetId).isPresent())
            throw new CodeException(CoworkerExceptionCode.ALREADY_REQUESTED);

        // accept
        requestRepository.findByFromIdAndToId(targetId, profileId)
                .ifPresent(request -> accept(authUser, request.getId()));

        CoworkerRequestEntity persisted = requestRepository.save(CoworkerRequestEntity.builder()
                .fromId(profileId)
                .toId(targetId)
                .build());
        return CoworkerRequest.of(persisted);
    }

    @Transactional(readOnly = true)
    public List<CoworkerProfile> listReceived(AuthUser authUser) {
        Profile profile = profileFinder.findByMemberId(authUser.id());
        List<CoworkerRequest> requests = requestRepository.findByToId(profile.id())
                .stream().map(CoworkerRequest::of).toList();

        List<Long> profileIds = requests.stream()
                .map(CoworkerRequest::fromId)
                .toList();

        Map<Long, Profile> profileById = profileRepository.findByIdIn(profileIds).stream()
                .map(Profile::of)
                .collect(Collectors.toMap(Profile::id, Function.identity()));

        List<Long> memberIds = profileById.values().stream()
                .map(Profile::memberId)
                .toList();

        Map<Long, Member> memberById = memberRepository.findByIdIn(memberIds).stream()
                .map(Member::of)
                .collect(Collectors.toMap(Member::id, Function.identity()));

        return requests.stream()
                .map(request -> {
                    Profile counterpart = profileById.get(request.fromId());
                    Member member = memberById.get(counterpart.memberId());
                    return CoworkerProfile.of(request.id(), member, counterpart);
                })
                .toList();
    }

    @Transactional(readOnly = true)
    public List<CoworkerProfile> listSent(AuthUser authUser) {
        Profile profile = profileFinder.findByMemberId(authUser.id());
        List<CoworkerRequest> requests = requestRepository.findByFromId(profile.id())
                .stream().map(CoworkerRequest::of).toList();

        List<Long> profileIds = requests.stream()
                .map(CoworkerRequest::toId)
                .toList();

        Map<Long, Profile> profileById = profileRepository.findByIdIn(profileIds).stream()
                .map(Profile::of)
                .collect(Collectors.toMap(Profile::id, Function.identity()));

        List<Long> memberIds = profileById.values().stream()
                .map(Profile::memberId)
                .toList();

        Map<Long, Member> memberById = memberRepository.findByIdIn(memberIds).stream()
                .map(Member::of)
                .collect(Collectors.toMap(Member::id, Function.identity()));

        return requests.stream()
                .map(request -> {
                    Profile counterpart = profileById.get(request.toId());
                    Member member = memberById.get(counterpart.memberId());
                    return CoworkerProfile.of(request.id(), member, counterpart);
                })
                .toList();
    }

    @Transactional
    public void accept(AuthUser authUser, Long id) {
        Profile profile = profileFinder.findByMemberId(authUser.id());
        CoworkerRequestEntity found = requestRepository.findById(id)
                .orElseThrow(() -> new CodeException(CoworkerExceptionCode.REQUEST_NOT_FOUND));

        if (!found.getToId().equals(profile.id()))
            throw new CodeException(CommonExceptionCode.FORBIDDEN);

        Long fromId = found.getFromId();
        Long toId = found.getToId();

        requestRepository.delete(found);
        CoworkerEntity coworker = CoworkerEntity.builder()
                .minId(Math.min(fromId, toId))
                .maxId(Math.max(fromId, toId))
                .build();
        coworkerRepository.save(coworker);
    }

    @Transactional
    public void deny(AuthUser authUser, Long id) {
        Profile profile = profileFinder.findByMemberId(authUser.id());
        CoworkerRequestEntity found = requestRepository.findById(id)
                .orElseThrow(() -> new CodeException(CoworkerExceptionCode.REQUEST_NOT_FOUND));

        if (!found.getToId().equals(profile.id()))
            throw new CodeException(CommonExceptionCode.FORBIDDEN);

        requestRepository.delete(found);
    }

    @Transactional
    public void cancel(AuthUser authUser, Long id) {
        Profile profile = profileFinder.findByMemberId(authUser.id());
        requestRepository.findById(id).ifPresent(found -> {
            if (!found.getFromId().equals(profile.id()))
                throw new CodeException(CommonExceptionCode.FORBIDDEN);

            requestRepository.delete(found);
        });
    }
}
