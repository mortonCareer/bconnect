package to.bconnect.api.core.domain.coworker;

import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import to.bconnect.api.core.domain.MemberResolver;
import to.bconnect.api.security.member.Member;
import to.bconnect.api.storage.coworker.CoworkerEntity;
import to.bconnect.api.storage.coworker.CoworkerRepository;
import to.bconnect.api.common.CodeException;
import to.bconnect.api.common.CommonExceptionCode;
import to.bconnect.api.security.AuthUser;

import java.util.List;
import java.util.Map;

@Service
@RequiredArgsConstructor
public class CoworkerService {

    private final CoworkerRepository coworkerRepository;
    private final MemberResolver memberResolver;

    @Transactional(readOnly = true)
    public List<Coworker> list(Long targetId) {
        List<CoworkerEntity> coworkers = coworkerRepository.findByMemberId(targetId);
        List<Long> memberIds = coworkers.stream()
                .map(it -> counterpartId(it, targetId))
                .toList();
        Map<Long, Member> memberMap = memberResolver.map(memberIds);

        return coworkers.stream()
                .map(it -> {
                    Member member = memberMap.get(counterpartId(it, targetId));
                    return new Coworker(it.getId(), member);
                })
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
