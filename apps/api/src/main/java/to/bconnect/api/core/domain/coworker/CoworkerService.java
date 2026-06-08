package to.bconnect.api.core.domain.coworker;

import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import to.bconnect.api.storage.coworker.CoworkerEntity;
import to.bconnect.api.storage.coworker.CoworkerRepository;
import to.bconnect.api.common.CodeException;
import to.bconnect.api.common.CommonExceptionCode;
import to.bconnect.api.security.AuthUser;

import java.util.List;

@Service
@RequiredArgsConstructor
public class CoworkerService {

    private final CoworkerRepository coworkerRepository;

    @Transactional(readOnly = true)
    public List<Coworker> list(Long targetId) {
        return coworkerRepository.findByMemberId(targetId).stream()
                .map(it -> Coworker.of(it, counterpartId(it, targetId)))
                .toList();
    }

    @Transactional(readOnly = true)
    public boolean isCoworker(Long memberId, Long targetId) {
        return coworkerRepository.existsByMinIdAndMaxId(
                Math.min(memberId, targetId),
                Math.max(memberId, targetId)
        );
    }

    @Transactional
    public void delete(AuthUser user, Long id) {
        coworkerRepository.findById(id).ifPresent(found -> {
            if (!found.getMinId().equals(user.id()) && !found.getMaxId().equals(user.id()))
                throw new CodeException(CommonExceptionCode.FORBIDDEN);

            coworkerRepository.delete(found);
        });
    }

    private Long counterpartId(CoworkerEntity coworker, Long targetId) {
        return coworker.getMinId().equals(targetId)
                ? coworker.getMaxId()
                : coworker.getMinId();
    }
}
