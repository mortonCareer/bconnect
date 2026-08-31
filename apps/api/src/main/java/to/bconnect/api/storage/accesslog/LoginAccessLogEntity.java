package to.bconnect.api.storage.accesslog;

import jakarta.persistence.Entity;
import jakarta.persistence.Table;
import lombok.AccessLevel;
import lombok.Getter;
import lombok.NoArgsConstructor;
import to.bconnect.api.storage.BaseEntity;
import to.bconnect.api.storage.RetentionPolicy;

@Entity
@Table(name = "login_access_logs")
@Getter
@NoArgsConstructor(access = AccessLevel.PROTECTED)
@RetentionPolicy("P3M")
public class LoginAccessLogEntity extends BaseEntity {

    private Long memberId;

    private String agent;

    private String ip;

    public LoginAccessLogEntity(Long memberId, String agent, String ip) {
        this.memberId = memberId;
        this.agent = agent;
        this.ip = ip;
    }
}
