package to.bconnect.api.core.domain.coworker;

import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Component;
import to.bconnect.api.storage.coworker.CoworkerRepository;

import java.util.List;

@Component
@RequiredArgsConstructor
public class CoworkerFinder {

    private final CoworkerRepository coworkerRepository;

    public List<Coworker> findAllByMemberId(Long memberId) {
        return coworkerRepository.findByMemberId(memberId)
                .stream().map(Coworker::of).toList();
    }

    public boolean isCoworker(Long memberId, Long targetId) {
        return coworkerRepository.existsByMinIdAndMaxId(
                Math.min(memberId, targetId),
                Math.max(memberId, targetId)
        );
    }
}
