package to.bconnect.api.core.domain.coworker;

import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import to.bconnect.api.storage.coworker.CoworkerRepository;
import to.bconnect.api.common.CodeException;
import to.bconnect.api.common.CommonExceptionCode;
import to.bconnect.api.security.AuthUser;

import java.util.List;

@Service
@RequiredArgsConstructor
public class CoworkerService {

    private final CoworkerRepository coworkerRepository;
    private final CoworkerFinder coworkerFinder;

    @Transactional(readOnly = true)
    public List<Coworker> list(Long targetId) {
        return coworkerFinder.findAllByMemberId(targetId);
    }

    @Transactional
    public void delete(AuthUser user, Long id) {
        coworkerRepository.findById(id).ifPresent(found -> {
            if (!found.getMinId().equals(user.id()) && !found.getMaxId().equals(user.id()))
                throw new CodeException(CommonExceptionCode.FORBIDDEN);

            coworkerRepository.delete(found);
        });
    }
}
