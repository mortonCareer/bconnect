package to.bconnect.api.core.domain.coworker;

import lombok.extern.slf4j.Slf4j;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import to.bconnect.api.security.AuthUser;
import to.bconnect.api.storage.coworker.CoworkerRequestRepository;

import java.util.List;

@Slf4j
@Service
@RequiredArgsConstructor
public class CoworkerRequestQueryService {

    private final CoworkerRequestRepository coworkerRequestRepository;

    @Transactional(readOnly = true)
    public List<CoworkerRequest> listReceived(AuthUser user) {
        return coworkerRequestRepository.findByToId(user.id()).stream()
                .map(it -> CoworkerRequest.of(it, it.getFromId()))
                .toList();
    }

    @Transactional(readOnly = true)
    public List<CoworkerRequest> listSent(AuthUser user) {
        return coworkerRequestRepository.findByFromId(user.id()).stream()
                .map(it -> CoworkerRequest.of(it, it.getToId()))
                .toList();
    }
}
