package so.morton.api.domain.coworker;

import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import so.morton.api.domain.profile.Profile;
import so.morton.api.domain.profile.ProfileFinder;
import so.morton.api.storage.domain.coworker.CoworkerEntity;
import so.morton.api.storage.domain.coworker.CoworkerRepository;
import so.morton.api.storage.value.CoworkerStatus;
import so.morton.api.storage.value.CoworkerUtils;
import so.morton.api.support.CodeException;
import so.morton.api.support.CommonExceptionCode;
import so.morton.api.support.auth.User;

import java.util.List;
import java.util.Optional;

@Service
@RequiredArgsConstructor
public class CoworkerService {

    private final CoworkerRepository coworkerRepository;
    private final CoworkerFinder coworkerFinder;
    private final ProfileFinder profileFinder;

    @Transactional(readOnly = true)
    public List<Coworker> get(User user, Long targetId) {
        Profile profile = profileFinder.findByMemberId(user.id());

        if (profile.id().equals(targetId))
            return coworkerFinder.find(targetId);
        if (coworkerFinder.isCoworker(profile.id(), targetId))
            return coworkerFinder.findAccepted(targetId);

        throw new CodeException(CommonExceptionCode.FORBIDDEN);
    }

    @Transactional
    public Long create(User user, Long targetId) {
        Profile profile = profileFinder.findByMemberId(user.id());

        if (profile.id().equals(targetId))
            throw new CodeException(CoworkerExceptionCode.SELF_REQUEST);
        if (!profileFinder.existsById(targetId))
            throw new CodeException(CoworkerExceptionCode.TARGET_NOT_FOUND);

        String pair = CoworkerUtils.pairOf(profile.id(), targetId);
        Optional<CoworkerEntity> optional = coworkerRepository.findByPair(pair);
        if (optional.isPresent()) {
            CoworkerEntity found = optional.get();
            if (found.getStatus() == CoworkerStatus.ACCEPTED)
                throw new CodeException(CoworkerExceptionCode.ALREADY_ACCEPTED);
            if (found.getToId().equals(profile.id()))
                found.accept();
        }

        CoworkerEntity coworker = CoworkerEntity.builder()
                .fromId(profile.id())
                .toId(targetId)
                .build();
        CoworkerEntity saved = coworkerRepository.save(coworker);
        return saved.getId();
    }

    @Transactional
    public void accept(User user, Long id) {
        Profile profile = profileFinder.findByMemberId(user.id());
        CoworkerEntity coworker = coworkerRepository.findById(id)
                .orElseThrow(() -> new CodeException(CoworkerExceptionCode.NOT_FOUND));

        if (!coworker.getFromId().equals(profile.id()))
            throw new CodeException(CommonExceptionCode.FORBIDDEN);

        coworker.accept();
    }

    @Transactional
    public void deny(User user, Long id) {
        Profile profile = profileFinder.findByMemberId(user.id());
        CoworkerEntity coworker = coworkerRepository.findById(id)
                .orElseThrow(() -> new CodeException(CoworkerExceptionCode.NOT_FOUND));

        if (!coworker.getToId().equals(profile.id()))
            throw new CodeException(CommonExceptionCode.FORBIDDEN);
        if (coworker.getStatus() == CoworkerStatus.ACCEPTED)
            throw new CodeException(CoworkerExceptionCode.ALREADY_ACCEPTED);

        coworkerRepository.delete(coworker);
    }

    @Transactional
    public void cancel(User user, Long id) {
        Profile profile = profileFinder.findByMemberId(user.id());
        CoworkerEntity coworker = coworkerRepository.findById(id)
                .orElseThrow(() -> new CodeException(CoworkerExceptionCode.NOT_FOUND));

        if (!coworker.getFromId().equals(profile.id()))
            throw new CodeException(CommonExceptionCode.FORBIDDEN);
        if (coworker.getStatus() == CoworkerStatus.ACCEPTED)
            throw new CodeException(CoworkerExceptionCode.ALREADY_ACCEPTED);

        coworkerRepository.delete(coworker);
    }

    @Transactional
    public void delete(User user, Long id) {
        Profile profile = profileFinder.findByMemberId(user.id());
        CoworkerEntity coworker = coworkerRepository.findById(id)
                .orElseThrow(() -> new CodeException(CoworkerExceptionCode.NOT_FOUND));

        if (!coworker.getFromId().equals(profile.id()) && !coworker.getToId().equals(profile.id()))
            throw new CodeException(CommonExceptionCode.FORBIDDEN);

        coworkerRepository.delete(coworker);
    }
}
