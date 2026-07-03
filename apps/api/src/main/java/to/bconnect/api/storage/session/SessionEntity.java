package to.bconnect.api.storage.session;

import jakarta.persistence.Entity;
import jakarta.persistence.Table;
import lombok.AccessLevel;
import lombok.Getter;
import lombok.NoArgsConstructor;
import to.bconnect.api.storage.BaseEntity;

@Entity
@Table(name = "sessions")
@Getter
@NoArgsConstructor(access = AccessLevel.PROTECTED)
public class SessionEntity extends BaseEntity {

    private Long memberId;

    private String agent;

    private String ip;

    private String refreshToken;

    private boolean revoked;

    public SessionEntity(Long memberId, String agent, String ip, String refreshToken) {
        this.memberId = memberId;
        this.agent = agent;
        this.ip = ip;
        this.refreshToken = refreshToken;
        this.revoked = false;
    }

    public void update(String agent, String ip, String refreshToken) {
        this.agent = agent;
        this.ip = ip;
        this.refreshToken = refreshToken;
        this.revoked = false;
    }

    public void rotate(String refreshToken) {
        this.refreshToken = refreshToken;
        this.revoked = false;
    }

    public void revoke() {
        this.revoked = true;
    }
}
