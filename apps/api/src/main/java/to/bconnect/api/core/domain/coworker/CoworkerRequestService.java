package to.bconnect.api.core.domain.coworker;

import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import to.bconnect.api.storage.coworker.CoworkerEntity;
import to.bconnect.api.storage.coworker.CoworkerRepository;
import to.bconnect.api.storage.coworker.CoworkerRequestEntity;
import to.bconnect.api.storage.coworker.CoworkerRequestRepository;
import to.bconnect.api.storage.member.MemberRepository;
import to.bconnect.api.common.CodeException;
import to.bconnect.api.common.CommonExceptionCode;
import to.bconnect.api.security.AuthUser;

@Service
@RequiredArgsConstructor
public class CoworkerRequestService {

    private final CoworkerRepository coworkerRepository;
    private final CoworkerRequestRepository coworkerRequestRepository;
    private final MemberRepository memberRepository;

    @Transactional
    public Long create(AuthUser user, Long targetId) {
        if (user.id().equals(targetId))
            throw new CodeException(CoworkerExceptionCode.SELF_REQUEST);
        if (!memberRepository.existsById(targetId))
            throw new CodeException(CoworkerExceptionCode.TARGET_NOT_FOUND);
        if (coworkerRepository.existsByMinIdAndMaxId(Math.min(user.id(), targetId), Math.max(user.id(), targetId)))
            throw new CodeException(CoworkerExceptionCode.ALREADY_COWORKER);
        if (coworkerRequestRepository.findByFromIdAndToId(user.id(), targetId).isPresent())
            throw new CodeException(CoworkerExceptionCode.ALREADY_REQUESTED);

        // accept
        coworkerRequestRepository.findByFromIdAndToId(targetId, user.id())
                .ifPresent(it -> accept(user, it.getId()));

        CoworkerRequestEntity created = coworkerRequestRepository.save(
                new CoworkerRequestEntity(user.id(), targetId));

        return created.getId();
    }

    @Transactional
    public void accept(AuthUser user, Long id) {
        CoworkerRequestEntity found = coworkerRequestRepository.findById(id)
                .orElseThrow(() -> new CodeException(CoworkerExceptionCode.REQUEST_NOT_FOUND));

        if (!found.getToId().equals(user.id()))
            throw new CodeException(CommonExceptionCode.FORBIDDEN);

        Long fromId = found.getFromId();
        Long toId = found.getToId();

        coworkerRequestRepository.delete(found);

        CoworkerEntity created = new CoworkerEntity(
                Math.min(fromId, toId),
                Math.max(fromId, toId)
        );

        coworkerRepository.save(created);
    }

    @Transactional
    public void deny(AuthUser user, Long id) {
        CoworkerRequestEntity found = coworkerRequestRepository.findById(id)
                .orElseThrow(() -> new CodeException(CoworkerExceptionCode.REQUEST_NOT_FOUND));

        if (!found.getToId().equals(user.id()))
            throw new CodeException(CommonExceptionCode.FORBIDDEN);

        coworkerRequestRepository.delete(found);
    }

    @Transactional
    public void cancel(AuthUser user, Long id) {
        coworkerRequestRepository.findById(id).ifPresent(it -> {
            if (!it.getFromId().equals(user.id()))
                throw new CodeException(CommonExceptionCode.FORBIDDEN);

            coworkerRequestRepository.delete(it);
        });
    }
}
