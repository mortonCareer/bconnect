package to.bconnect.api.domain.coworker;

import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Component;
import to.bconnect.api.storage.domain.coworker.CoworkerRepository;

import java.util.List;

@Component
@RequiredArgsConstructor
public class CoworkerFinder {

    private final CoworkerRepository coworkerRepository;

    public List<Coworker> findAllByProfileId(Long profileId) {
        return coworkerRepository.findByProfileId(profileId)
                .stream().map(Coworker::of).toList();
    }

    public boolean isCoworker(Long profileId, Long targetId) {
        return coworkerRepository.existsByMinIdAndMaxId(
                Math.min(profileId, targetId),
                Math.max(profileId, targetId)
        );
    }
}
