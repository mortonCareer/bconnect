package so.morton.api.domain.coworker;

import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import so.morton.api.domain.profile.Profile;
import so.morton.api.domain.profile.ProfileFinder;
import so.morton.api.storage.domain.coworker.CoworkerEntity;
import so.morton.api.storage.domain.coworker.CoworkerRepository;
import so.morton.api.storage.domain.coworker.CoworkerRequestEntity;
import so.morton.api.storage.domain.coworker.CoworkerRequestRepository;
import so.morton.api.support.CodeException;
import so.morton.api.support.CommonExceptionCode;
import so.morton.api.support.auth.User;

import java.util.Optional;

@Service
@RequiredArgsConstructor
public class CoworkerRequestService {

    private final CoworkerRepository coworkerRepository;
    private final CoworkerRequestRepository requestRepository;
    private final ProfileFinder profileFinder;

    @Transactional
    public CoworkerRequest create(User user, Long targetId) {
        Profile profile = profileFinder.findByMemberId(user.id());
        Long profileId = profile.id();

        if (profileId.equals(targetId))
            throw new CodeException(CoworkerExceptionCode.SELF_REQUEST);
        if (!profileFinder.existsById(targetId))
            throw new CodeException(CoworkerExceptionCode.TARGET_NOT_FOUND);
        if (coworkerRepository.existsByMinIdAndMaxId(Math.min(profileId, targetId), Math.max(profileId, targetId)))
            throw new CodeException(CoworkerExceptionCode.ALREADY_COWORKER);

        // accept
        Optional<CoworkerRequestEntity> reverse = requestRepository.findByFromIdAndToId(targetId, profileId);
        reverse.ifPresent(request -> accept(user, request.getId()));

        CoworkerRequestEntity persisted = requestRepository.save(CoworkerRequestEntity.builder()
                .fromId(profileId)
                .toId(targetId)
                .build());
        return CoworkerRequest.of(persisted);
    }

    @Transactional
    public void accept(User user, Long id) {
        Profile profile = profileFinder.findByMemberId(user.id());
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
    public void deny(User user, Long id) {
        Profile profile = profileFinder.findByMemberId(user.id());
        CoworkerRequestEntity found = requestRepository.findById(id)
                .orElseThrow(() -> new CodeException(CoworkerExceptionCode.REQUEST_NOT_FOUND));

        if (!found.getToId().equals(profile.id()))
            throw new CodeException(CommonExceptionCode.FORBIDDEN);

        requestRepository.delete(found);
    }

    @Transactional
    public void cancel(User user, Long id) {
        Profile profile = profileFinder.findByMemberId(user.id());
        CoworkerRequestEntity found = requestRepository.findById(id)
                .orElseThrow(() -> new CodeException(CoworkerExceptionCode.REQUEST_NOT_FOUND));

        if (!found.getFromId().equals(profile.id()))
            throw new CodeException(CommonExceptionCode.FORBIDDEN);

        requestRepository.delete(found);
    }
}
