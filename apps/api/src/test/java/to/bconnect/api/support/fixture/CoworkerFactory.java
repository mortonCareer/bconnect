package to.bconnect.api.support.fixture;

import org.springframework.stereotype.Component;
import to.bconnect.api.core.domain.coworker.Coworker;
import to.bconnect.api.storage.coworker.CoworkerEntity;

@Component
public class CoworkerFactory {

    public static Coworker domain(Long id, Long memberId) {
        return new Coworker(id, memberId);
    }

    public static CoworkerEntity entity(Long memberId, Long otherId) {
        return CoworkerEntity.of(memberId, otherId);
    }
}
