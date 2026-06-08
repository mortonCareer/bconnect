package to.bconnect.api.core.domain.coworker;

import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import to.bconnect.api.security.AuthUser;
import to.bconnect.api.storage.coworker.CoworkerRequestRepository;

import java.util.List;

@Service
@RequiredArgsConstructor
public class CoworkerRequestQueryService {

    private final CoworkerRequestRepository requestRepository;

    @Transactional(readOnly = true)
    public List<CoworkerRequest> listReceived(AuthUser user) {
        return requestRepository.findByToId(user.id()).stream()
                .map(it -> CoworkerRequest.of(it, it.getFromId()))
                .toList();
    }

    @Transactional(readOnly = true)
    public List<CoworkerRequest> listSent(AuthUser user) {
        return requestRepository.findByFromId(user.id()).stream()
                .map(it -> CoworkerRequest.of(it, it.getToId()))
                .toList();
    }
}
