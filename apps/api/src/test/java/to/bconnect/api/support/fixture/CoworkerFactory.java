package to.bconnect.api.support.fixture;

import org.springframework.stereotype.Component;
import to.bconnect.api.core.domain.coworker.Coworker;
import to.bconnect.api.security.member.Member;
import to.bconnect.api.storage.coworker.CoworkerEntity;

@Component
public class CoworkerFactory {

    public static Coworker create(Long id, Member member) {
        return new Coworker(id, member);
    }

    public static CoworkerEntity createEntity(Long minId, Long maxId) {
        return new CoworkerEntity(minId, maxId);
    }
}
