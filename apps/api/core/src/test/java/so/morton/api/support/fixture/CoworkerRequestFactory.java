package so.morton.api.support.fixture;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Component;
import so.morton.api.storage.domain.coworker.CoworkerRequestEntity;
import so.morton.api.storage.domain.coworker.CoworkerRequestRepository;

@Component
public class CoworkerRequestFactory {

    @Autowired private CoworkerRequestRepository coworkerRequestRepository;

    public CoworkerRequestEntity create(Long fromId, Long toId) {
        return coworkerRequestRepository.save(CoworkerRequestEntity.builder()
                .fromId(fromId)
                .toId(toId)
                .build());
    }
}
