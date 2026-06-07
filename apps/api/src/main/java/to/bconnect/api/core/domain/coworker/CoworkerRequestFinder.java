package to.bconnect.api.core.domain.coworker;

import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Component;
import to.bconnect.api.core.storage.coworker.CoworkerRequestRepository;

import java.util.List;

@Component
@RequiredArgsConstructor
public class CoworkerRequestFinder {

    private final CoworkerRequestRepository requestRepository;

    public List<CoworkerRequest> findAllReceived(Long profileId) {
        return requestRepository.findByToId(profileId)
                .stream().map(CoworkerRequest::of).toList();
    }

    public List<CoworkerRequest> findAllSent(Long profileId) {
        return requestRepository.findByFromId(profileId)
                .stream().map(CoworkerRequest::of).toList();
    }
}
