package to.bconnect.api.support.fixture;

import to.bconnect.api.storage.session.SessionEntity;

public class SessionFactory {

    public static SessionEntity createEntity(Long memberId) {
        return new SessionEntity(memberId, "agent", "ip", "refresh-token");
    }

    public static SessionEntity createEntity(Long memberId, String agent, String ip, String refreshToken) {
        return new SessionEntity(memberId, agent, ip, refreshToken);
    }
}
