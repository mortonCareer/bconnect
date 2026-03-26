package so.morton.api.support.fixture;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Component;
import so.morton.api.storage.domain.coworker.CoworkerEntity;
import so.morton.api.storage.domain.coworker.CoworkerRepository;

@Component
public class CoworkerFactory {

    @Autowired private CoworkerRepository coworkerRepository;

    public CoworkerEntity create(Long minId, Long maxId) {
        return coworkerRepository.save(CoworkerEntity.builder()
                .minId(minId)
                .maxId(maxId)
                .build());
    }
}
