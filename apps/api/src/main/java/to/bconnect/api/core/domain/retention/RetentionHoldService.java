package to.bconnect.api.core.domain.retention;

import lombok.RequiredArgsConstructor;
import lombok.val;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import to.bconnect.api.common.CodeException;
import to.bconnect.api.common.CommonExceptionCode;
import to.bconnect.api.storage.member.MemberRepository;
import to.bconnect.api.storage.retention.RetentionHoldEntity;
import to.bconnect.api.storage.retention.RetentionHoldRepository;

import java.time.Instant;
import java.util.List;

@Service
@RequiredArgsConstructor
public class RetentionHoldService {

    private final RetentionHoldRepository retentionHoldRepository;
    private final MemberRepository memberRepository;

    @Transactional(readOnly = true)
    public List<RetentionHold> list(Long memberId) {
        return retentionHoldRepository.findAllByMemberIdOrderByIdDesc(memberId).stream()
                .map(RetentionHold::of)
                .toList();
    }

    @Transactional
    public Long create(CreateRetentionHold command) {
        if (!command.expireAt().isAfter(Instant.now()))
            throw new CodeException(CommonExceptionCode.NOT_VALID);

        val member = memberRepository.findById(command.memberId())
                .orElseThrow(() -> new CodeException(CommonExceptionCode.NOT_FOUND));
        val created = retentionHoldRepository.save(new RetentionHoldEntity(
                member.getId(), command.type(), command.reason(), command.expireAt()
        ));
        return created.getId();
    }

    @Transactional
    public void release(Long id) {
        retentionHoldRepository.deleteById(id);
    }
}
