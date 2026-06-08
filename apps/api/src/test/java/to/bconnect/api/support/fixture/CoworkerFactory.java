package to.bconnect.api.support.fixture;

import org.springframework.stereotype.Component;
import to.bconnect.api.core.domain.coworker.Coworker;
import to.bconnect.api.storage.coworker.CoworkerEntity;

@Component
public class CoworkerFactory {

    public static Coworker create(Long id, Long memberId) {
        return new Coworker(id, memberId);
    }

    public static CoworkerEntity createEntity(Long minId, Long maxId) {
        return new CoworkerEntity(minId, maxId);
    }
}
