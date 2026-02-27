package so.morton.api.domain.coworker;

import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Component;
import so.morton.api.storage.domain.coworker.CoworkerRepository;
import so.morton.api.storage.domain.coworker.CoworkerRequestRepository;

import java.util.List;

@Component
@RequiredArgsConstructor
public class CoworkerFinder {

    private final CoworkerRepository coworkerRepository;
    private final CoworkerRequestRepository requestRepository;

    public List<Coworker> find(Long profileId) {
        return coworkerRepository.findByProfileId(profileId)
                .stream().map(Coworker::of).toList();
    }

    public List<CoworkerRequest> findRequests(Long profileId) {
        return requestRepository.findByProfileId(profileId)
                .stream().map(CoworkerRequest::of).toList();
    }

    public boolean isCoworker(Long profileId, Long targetId) {
        return coworkerRepository.existsByMinIdAndMaxId(
                Math.min(profileId, targetId),
                Math.max(profileId, targetId)
        );
    }
}
