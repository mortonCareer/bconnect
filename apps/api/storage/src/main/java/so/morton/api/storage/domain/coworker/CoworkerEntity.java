package so.morton.api.storage.domain.coworker;

import jakarta.persistence.*;
import lombok.AccessLevel;
import lombok.Builder;
import lombok.EqualsAndHashCode;
import lombok.Getter;
import lombok.NoArgsConstructor;
import so.morton.api.storage.value.CoworkerStatus;

@Entity
@Table(name = "coworkers")
@Getter
@EqualsAndHashCode(of = "id")
@NoArgsConstructor(access = AccessLevel.PROTECTED)
public class CoworkerEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false)
    private Long fromId;

    @Column(nullable = false)
    private Long toId;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private CoworkerStatus status = CoworkerStatus.PENDING;

    @Column(unique = true, nullable = false)
    private String pair;

    @Builder
    public CoworkerEntity(Long fromId, Long toId) {
        this.fromId = fromId;
        this.toId = toId;
        this.pair = pairOf(fromId, toId);
    }

    public void accept() {
        this.status = CoworkerStatus.ACCEPTED;
    }

    public static String pairOf(Long a, Long b) {
        return Math.min(a, b) + "_" + Math.max(a, b);
    }
}