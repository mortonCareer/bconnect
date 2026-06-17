package to.bconnect.api.support.fixture;

import to.bconnect.api.storage.session.SessionEntity;

public class SessionFactory {

    public static SessionEntity createEntity(String username) {
        return new SessionEntity(username, "agent", "ip", "refresh-token");
    }

    public static SessionEntity createEntity(String username, String agent, String ip, String refreshToken) {
        return new SessionEntity(username, agent, ip, refreshToken);
    }
}
