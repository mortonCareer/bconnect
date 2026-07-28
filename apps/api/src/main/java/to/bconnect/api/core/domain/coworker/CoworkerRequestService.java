package to.bconnect.api.core.domain.coworker;

import lombok.extern.slf4j.Slf4j;
import lombok.RequiredArgsConstructor;
import lombok.val;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import to.bconnect.api.common.CodeException;
import to.bconnect.api.common.CommonExceptionCode;
import to.bconnect.api.security.AuthUser;
import to.bconnect.api.storage.coworker.CoworkerEntity;
import to.bconnect.api.storage.coworker.CoworkerRepository;
import to.bconnect.api.storage.coworker.CoworkerRequestEntity;
import to.bconnect.api.storage.coworker.CoworkerRequestRepository;
import to.bconnect.api.storage.member.MemberRepository;

@Slf4j
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
            throw new CodeException(CommonExceptionCode.NOT_FOUND);
        if (coworkerRepository.existsByMembers(user.id(), targetId))
            throw new CodeException(CoworkerExceptionCode.ALREADY_COWORKER);

        val reverse = coworkerRequestRepository.findByFromIdAndToId(targetId, user.id());
        if (reverse.isPresent()) {
            val accepted = reverse.get();
            coworkerRequestRepository.delete(accepted);
            coworkerRequestRepository.findByFromIdAndToId(user.id(), targetId)
                    .ifPresent(coworkerRequestRepository::delete);
            coworkerRepository.save(CoworkerEntity.of(accepted.getFromId(), accepted.getToId()));
            return accepted.getId();
        }

        val request = coworkerRequestRepository.findByFromIdAndToId(user.id(), targetId)
                .orElseGet(() -> coworkerRequestRepository.save(new CoworkerRequestEntity(user.id(), targetId)));

        return request.getId();
    }

    @Transactional
    public void accept(AuthUser user, Long id) {
        val found = coworkerRequestRepository.findById(id)
                .orElseThrow(() -> new CodeException(CommonExceptionCode.NOT_FOUND));

        if (!found.getToId().equals(user.id()))
            throw new CodeException(CommonExceptionCode.FORBIDDEN);

        coworkerRequestRepository.delete(found);
        coworkerRepository.save(CoworkerEntity.of(found.getFromId(), found.getToId()));
    }

    @Transactional
    public void deny(AuthUser user, Long id) {
        val found = coworkerRequestRepository.findById(id)
                .orElseThrow(() -> new CodeException(CommonExceptionCode.NOT_FOUND));

        if (!found.getToId().equals(user.id()))
            throw new CodeException(CommonExceptionCode.FORBIDDEN);

        coworkerRequestRepository.delete(found);
    }

    @Transactional
    public void cancel(AuthUser user, Long id) {
        val found = coworkerRequestRepository.findById(id)
                .orElseThrow(() -> new CodeException(CommonExceptionCode.NOT_FOUND));

        if (!found.getFromId().equals(user.id()))
            throw new CodeException(CommonExceptionCode.FORBIDDEN);

        coworkerRequestRepository.delete(found);
    }
}
