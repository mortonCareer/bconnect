package to.bconnect.api.domain.coworker;

import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Component;
import to.bconnect.api.storage.domain.coworker.CoworkerRequestRepository;

import java.util.List;

@Component
@RequiredArgsConstructor
public class CoworkerRequestFinder {

    private final CoworkerRequestRepository requestRepository;

    public List<CoworkerRequest> findReceived(Long profileId) {
        return requestRepository.findByToId(profileId)
                .stream().map(CoworkerRequest::of).toList();
    }

    public List<CoworkerRequest> findSent(Long profileId) {
        return requestRepository.findByFromId(profileId)
                .stream().map(CoworkerRequest::of).toList();
    }
}
