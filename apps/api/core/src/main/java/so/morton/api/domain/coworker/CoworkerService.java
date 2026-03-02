package so.morton.api.domain.coworker;

import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import so.morton.api.domain.profile.Profile;
import so.morton.api.domain.profile.ProfileFinder;
import so.morton.api.storage.domain.coworker.CoworkerEntity;
import so.morton.api.storage.domain.coworker.CoworkerRepository;
import so.morton.api.support.CodeException;
import so.morton.api.support.CommonExceptionCode;
import so.morton.api.support.auth.User;

import java.util.List;

@Service
@RequiredArgsConstructor
public class CoworkerService {

    private final CoworkerRepository coworkerRepository;
    private final CoworkerFinder coworkerFinder;
    private final ProfileFinder profileFinder;

    @Transactional(readOnly = true)
    public List<Coworker> getAll(User user, Long targetId) {
        Profile profile = profileFinder.findByMemberId(user.id());

        if (profile.id().equals(targetId))
            return coworkerFinder.find(targetId);
        if (coworkerFinder.isCoworker(profile.id(), targetId))
            return coworkerFinder.find(targetId);

        throw new CodeException(CommonExceptionCode.FORBIDDEN);
    }

    @Transactional
    public void delete(User user, Long id) {
        Profile profile = profileFinder.findByMemberId(user.id());
        CoworkerEntity found = coworkerRepository.findById(id)
                .orElseThrow(() -> new CodeException(CoworkerExceptionCode.NOT_FOUND));

        if (!found.getMinId().equals(profile.id()) && !found.getMaxId().equals(profile.id()))
            throw new CodeException(CommonExceptionCode.FORBIDDEN);

        coworkerRepository.delete(found);
    }
}
