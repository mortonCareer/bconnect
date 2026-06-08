package to.bconnect.api.storage.coworker;

import jakarta.persistence.*;
import lombok.AccessLevel;
import lombok.Builder;
import lombok.EqualsAndHashCode;
import lombok.Getter;
import lombok.NoArgsConstructor;

@Entity
@Table(name = "coworker_requests", uniqueConstraints = @UniqueConstraint(columnNames = {"from_id", "to_id"}))
@Getter
@EqualsAndHashCode(of = "id")
@NoArgsConstructor(access = AccessLevel.PROTECTED)
public class CoworkerRequestEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false)
    private Long fromId;

    @Column(nullable = false)
    private Long toId;

    @Builder
    public CoworkerRequestEntity(Long fromId, Long toId) {
        this.fromId = fromId;
        this.toId = toId;
    }
}
