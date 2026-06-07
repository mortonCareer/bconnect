package to.bconnect.api.support.fixture;

import org.springframework.stereotype.Component;
import to.bconnect.api.core.domain.coworker.Coworker;
import to.bconnect.api.core.storage.coworker.CoworkerEntity;

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
