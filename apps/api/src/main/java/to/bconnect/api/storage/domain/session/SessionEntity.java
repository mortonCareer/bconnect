package to.bconnect.api.storage.domain.session;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Table;
import lombok.AccessLevel;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import to.bconnect.api.storage.BaseEntity;

@Entity
@Table(name = "sessions")
@Getter
@NoArgsConstructor(access = AccessLevel.PROTECTED)
public class SessionEntity extends BaseEntity {

    @Column(nullable = false, unique = true)
    private String username;

    @Column(nullable = false)
    private String agent;

    @Column(nullable = false)
    private String ip;

    @Column(nullable = false)
    private String refreshToken;

    @Column(nullable = false)
    private boolean revoked;

    @Builder
    public SessionEntity(String username, String agent, String ip, String refreshToken) {
        this.username = username;
        this.agent = agent;
        this.ip = ip;
        this.refreshToken = refreshToken;
        this.revoked = false;
    }

    public void update(String agent, String ip, String refreshToken) {
        this.agent = agent;
        this.ip = ip;
        this.refreshToken = refreshToken;
    }

    public void rotate(String refreshToken) {
        this.refreshToken = refreshToken;
    }

    public void revoke() {
        this.revoked = true;
    }
}
