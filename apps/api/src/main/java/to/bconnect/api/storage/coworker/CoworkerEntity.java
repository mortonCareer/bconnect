package to.bconnect.api.storage.coworker;

import jakarta.persistence.*;
import lombok.AccessLevel;
import lombok.Getter;
import lombok.NoArgsConstructor;
import to.bconnect.api.storage.BaseEntity;

@Entity
@Table(name = "coworkers")
@Getter
@NoArgsConstructor(access = AccessLevel.PROTECTED)
public class CoworkerEntity extends BaseEntity {

    private Long minId;

    private Long maxId;

    private CoworkerEntity(Long minId, Long maxId) {
        this.minId = minId;
        this.maxId = maxId;
    }

    public static CoworkerEntity of(Long memberId, Long otherId) {
        return new CoworkerEntity(Math.min(memberId, otherId), Math.max(memberId, otherId));
    }

    public Long coworkerIdOf(Long memberId) {
        return minId.equals(memberId) ? maxId : minId;
    }
}
