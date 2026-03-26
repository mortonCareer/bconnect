package so.morton.api.support.fixture;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Component;
import so.morton.api.storage.domain.session.SessionEntity;
import so.morton.api.storage.domain.session.SessionRepository;

import java.util.UUID;

@Component
public class SessionFactory {

    @Autowired private SessionRepository sessionRepository;

    public SessionEntity create(String username) {
        return sessionRepository.save(SessionEntity.builder()
                .username(username)
                .agent("agent")
                .ip("ip")
                .refreshToken(UUID.randomUUID().toString())
                .build());
    }
}
