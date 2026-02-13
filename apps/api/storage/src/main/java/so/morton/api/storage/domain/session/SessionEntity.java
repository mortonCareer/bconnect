package so.morton.api.storage.domain.session;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Table;
import lombok.AccessLevel;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import so.morton.api.storage.support.BaseEntity;

@Entity
@Table(name = "sessions")
@Getter
@NoArgsConstructor(access = AccessLevel.PROTECTED)
public class SessionEntity extends BaseEntity {

    @Column(nullable = false, unique = true)
    private String username;

    @Column(nullable = false)
    private String agent;

    private String ip;

    @Column(name = "refresh_token")
    private String refreshToken;

    @Builder
    public SessionEntity(String username, String agent, String ip, String refreshToken) {
        this.username = username;
        this.agent = agent;
        this.ip = ip;
        this.refreshToken = refreshToken;
    }

    public void update(String agent, String ip, String refreshToken) {
        this.agent = agent;
        this.ip = ip;
        this.refreshToken = refreshToken;
    }
}
