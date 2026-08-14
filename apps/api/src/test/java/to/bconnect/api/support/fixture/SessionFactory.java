package to.bconnect.api.support.fixture;

import to.bconnect.api.security.session.IssuedSession;
import to.bconnect.api.security.session.NewDeviceLoginEvent;
import to.bconnect.api.storage.session.SessionEntity;

import java.util.UUID;

public class SessionFactory {

    public static IssuedSession domain() {
        return new IssuedSession("access-token");
    }

    public static SessionEntity entity(Long memberId) {
        return new SessionEntity(memberId, "agent", "ip", UUID.randomUUID().toString());
    }

    public static SessionEntity entity(Long memberId, String agent, String ip, String refreshToken) {
        return new SessionEntity(memberId, agent, ip, refreshToken);
    }

    public static NewDeviceLoginEvent newDeviceLoginEvent(Long memberId, String phone) {
        return new NewDeviceLoginEvent(memberId, phone);
    }
}
