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
    private final CoworkerRequestRepository requestRepository;
    private final MemberRepository memberRepository;

    @Transactional
    public Long create(AuthUser user, Long targetId) {
        if (user.id().equals(targetId))
            throw new CodeException(CoworkerExceptionCode.SELF_REQUEST);
        if (!memberRepository.existsById(targetId))
            throw new CodeException(CoworkerExceptionCode.TARGET_NOT_FOUND);
        if (coworkerRepository.existsByMinIdAndMaxId(Math.min(user.id(), targetId), Math.max(user.id(), targetId)))
            throw new CodeException(CoworkerExceptionCode.ALREADY_COWORKER);
        if (requestRepository.findByFromIdAndToId(user.id(), targetId).isPresent())
            throw new CodeException(CoworkerExceptionCode.ALREADY_REQUESTED);

        // accept
        requestRepository.findByFromIdAndToId(targetId, user.id())
                .ifPresent(request -> accept(user, request.getId()));

        CoworkerRequestEntity created = requestRepository.save(
                new CoworkerRequestEntity(user.id(), targetId));

        return created.getId();
    }

    @Transactional
    public void accept(AuthUser user, Long id) {
        CoworkerRequestEntity found = requestRepository.findById(id)
                .orElseThrow(() -> new CodeException(CoworkerExceptionCode.REQUEST_NOT_FOUND));

        if (!found.getToId().equals(user.id()))
            throw new CodeException(CommonExceptionCode.FORBIDDEN);

        Long fromId = found.getFromId();
        Long toId = found.getToId();

        requestRepository.delete(found);

        CoworkerEntity coworker = new CoworkerEntity(
                Math.min(fromId, toId),
                Math.max(fromId, toId)
        );

        coworkerRepository.save(coworker);
    }

    @Transactional
    public void deny(AuthUser user, Long id) {
        CoworkerRequestEntity found = requestRepository.findById(id)
                .orElseThrow(() -> new CodeException(CoworkerExceptionCode.REQUEST_NOT_FOUND));

        if (!found.getToId().equals(user.id()))
            throw new CodeException(CommonExceptionCode.FORBIDDEN);

        requestRepository.delete(found);
    }

    @Transactional
    public void cancel(AuthUser user, Long id) {
        requestRepository.findById(id).ifPresent(found -> {
            if (!found.getFromId().equals(user.id()))
                throw new CodeException(CommonExceptionCode.FORBIDDEN);

            requestRepository.delete(found);
        });
    }
}
