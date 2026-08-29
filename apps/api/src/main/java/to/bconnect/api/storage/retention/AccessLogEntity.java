package to.bconnect.api.storage.retention;

import jakarta.persistence.Entity;
import jakarta.persistence.Table;
import lombok.AccessLevel;
import lombok.Getter;
import lombok.NoArgsConstructor;
import to.bconnect.api.storage.BaseEntity;

@Entity
@Table(name = "access_logs")
@Getter
@NoArgsConstructor(access = AccessLevel.PROTECTED)
@RetentionPolicy("P3M")
public class AccessLogEntity extends BaseEntity {

    private Long memberId;

    private String agent;

    private String ip;

    public AccessLogEntity(Long memberId, String agent, String ip) {
        this.memberId = memberId;
        this.agent = agent;
        this.ip = ip;
    }
}
