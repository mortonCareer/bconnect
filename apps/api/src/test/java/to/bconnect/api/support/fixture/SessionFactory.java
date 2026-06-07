package to.bconnect.api.support.fixture;

import to.bconnect.api.core.storage.session.SessionEntity;

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
