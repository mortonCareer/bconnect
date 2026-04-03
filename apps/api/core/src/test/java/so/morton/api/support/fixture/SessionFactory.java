package so.morton.api.support.fixture;

import so.morton.api.storage.domain.session.SessionEntity;

public class SessionFactory {

    public static SessionEntity createEntity(String username) {
        return SessionEntity.builder()
                .username(username)
                .agent("agent")
                .ip("ip")
                .refreshToken("refresh-token")
                .build();
    }

    public static SessionEntity createEntity(String username, String agent, String ip, String refreshToken) {
        return SessionEntity.builder()
                .username(username)
                .agent(agent)
                .ip(ip)
                .refreshToken(refreshToken)
                .build();
    }
}
