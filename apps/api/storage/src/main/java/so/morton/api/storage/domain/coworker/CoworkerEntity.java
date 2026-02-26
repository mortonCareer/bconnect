package so.morton.api.storage.domain.coworker;

import jakarta.persistence.*;
import lombok.AccessLevel;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import so.morton.api.storage.support.BaseEntity;
import so.morton.api.storage.value.CoworkerStatus;

@Entity
@Table(name = "coworkers")
@Getter
@NoArgsConstructor(access = AccessLevel.PROTECTED)
public class CoworkerEntity extends BaseEntity {

    @Column(name = "from_id", nullable = false)
    private Long fromId;

    @Column(name = "to_id", nullable = false)
    private Long toId;

    @Column(unique = true)
    private String pair;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private CoworkerStatus status = CoworkerStatus.PENDING;

    @Builder
    public CoworkerEntity(Long fromId, Long toId) {
        this.fromId = fromId;
        this.toId = toId;
        this.pair = buildPair(fromId, toId);
    }

    public void accept() {
        this.status = CoworkerStatus.ACCEPTED;
    }

    public void deny() {
        this.status = CoworkerStatus.DENIED;
    }

    private static String buildPair(Long a, Long b) {
        long min = Math.min(a, b);
        long max = Math.max(a, b);
        return min + ":" + max;
    }
}