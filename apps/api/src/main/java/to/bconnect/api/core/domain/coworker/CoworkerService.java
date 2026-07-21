package to.bconnect.api.core.domain.coworker;

import lombok.extern.slf4j.Slf4j;
import lombok.RequiredArgsConstructor;
import lombok.val;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import to.bconnect.api.storage.coworker.CoworkerRepository;
import to.bconnect.api.storage.coworker.CoworkerRequestEntity;
import to.bconnect.api.storage.coworker.CoworkerRequestRepository;
import to.bconnect.api.storage.coworker.CoworkerStatus;
import to.bconnect.api.security.AuthUser;

import java.util.Collection;
import java.util.List;
import java.util.Map;
import java.util.function.Function;
import java.util.stream.Collectors;

@Slf4j
@Service
@RequiredArgsConstructor
public class CoworkerService {

    private final CoworkerRepository coworkerRepository;
    private final CoworkerRequestRepository coworkerRequestRepository;

    @Transactional(readOnly = true)
    public List<Coworker> list(Long targetId) {
        return coworkerRepository.findAllByMemberId(targetId).stream()
                .map(it -> Coworker.of(it, it.coworkerIdOf(targetId)))
                .toList();
    }

    @Transactional(readOnly = true)
    public CoworkerStatus resolveStatus(Long memberId, Long targetId) {
        if (coworkerRepository.existsByMembers(memberId, targetId))
            return CoworkerStatus.COWORKER;
        if (coworkerRequestRepository.existsByFromIdAndToId(memberId, targetId))
            return CoworkerStatus.SENT;
        if (coworkerRequestRepository.existsByFromIdAndToId(targetId, memberId))
            return CoworkerStatus.RECEIVED;
        return CoworkerStatus.NONE;
    }

    @Transactional(readOnly = true)
    public Map<Long, CoworkerStatus> resolveStatusMap(Long memberId, Collection<Long> targetIds) {
        val coworkerIds = coworkerRepository.findAllByMemberId(memberId).stream()
                .map(it -> it.coworkerIdOf(memberId))
                .collect(Collectors.toSet());
        val sentIds = coworkerRequestRepository.findAllByFromId(memberId).stream()
                .map(CoworkerRequestEntity::getToId)
                .collect(Collectors.toSet());
        val receivedIds = coworkerRequestRepository.findAllByToId(memberId).stream()
                .map(CoworkerRequestEntity::getFromId)
                .collect(Collectors.toSet());

        return targetIds.stream()
                .distinct()
                .collect(Collectors.toMap(Function.identity(),
                        it -> {
                            if (coworkerIds.contains(it)) return CoworkerStatus.COWORKER;
                            if (sentIds.contains(it)) return CoworkerStatus.SENT;
                            if (receivedIds.contains(it)) return CoworkerStatus.RECEIVED;
                            return CoworkerStatus.NONE;
                        }));
    }

    @Transactional
    public void delete(AuthUser user, Long memberId) {
        val optional = coworkerRepository.findByMembers(user.id(), memberId);
        if (optional.isEmpty())
            return;

        coworkerRepository.delete(optional.get());
    }
}
