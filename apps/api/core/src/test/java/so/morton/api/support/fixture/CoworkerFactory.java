package so.morton.api.support.fixture;

import org.springframework.stereotype.Component;
import so.morton.api.domain.coworker.Coworker;
import so.morton.api.storage.domain.coworker.CoworkerEntity;

@Component
public class CoworkerFactory {

    public static Coworker create(Long id, Long minId, Long maxId) {
        return new Coworker(id, minId, maxId);
    }

    public static CoworkerEntity createEntity(Long minId, Long maxId) {
        return CoworkerEntity.builder()
                .minId(minId)
                .maxId(maxId)
                .build();
    }
}
