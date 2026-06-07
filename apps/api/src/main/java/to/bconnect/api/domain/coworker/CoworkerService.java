package to.bconnect.api.domain.coworker;

import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import to.bconnect.api.domain.profile.Profile;
import to.bconnect.api.domain.profile.ProfileFinder;
import to.bconnect.api.storage.domain.coworker.CoworkerRepository;
import to.bconnect.api.common.CodeException;
import to.bconnect.api.common.CommonExceptionCode;
import to.bconnect.api.security.User;

import java.util.List;

@Service
@RequiredArgsConstructor
public class CoworkerService {

    private final CoworkerRepository coworkerRepository;
    private final CoworkerFinder coworkerFinder;
    private final ProfileFinder profileFinder;

    @Transactional(readOnly = true)
    public List<Coworker> list(User user, Long targetId) {
        Profile profile = profileFinder.findByMemberId(user.id());

        if (profile.id().equals(targetId))
            return coworkerFinder.findAllByProfileId(targetId);
        if (coworkerFinder.isCoworker(profile.id(), targetId))
            return coworkerFinder.findAllByProfileId(targetId);

        throw new CodeException(CommonExceptionCode.FORBIDDEN);
    }

    @Transactional
    public void delete(User user, Long id) {
        Profile profile = profileFinder.findByMemberId(user.id());
        coworkerRepository.findById(id).ifPresent(found -> {
            if (!found.getMinId().equals(profile.id()) && !found.getMaxId().equals(profile.id()))
                throw new CodeException(CommonExceptionCode.FORBIDDEN);

            coworkerRepository.delete(found);
        });
    }
}
