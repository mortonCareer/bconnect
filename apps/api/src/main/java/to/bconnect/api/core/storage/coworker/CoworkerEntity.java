package to.bconnect.api.core.storage.coworker;

import jakarta.persistence.*;
import lombok.AccessLevel;
import lombok.Builder;
import lombok.EqualsAndHashCode;
import lombok.Getter;
import lombok.NoArgsConstructor;

@Entity
@Table(name = "coworkers", uniqueConstraints = @UniqueConstraint(columnNames = {"min_id", "max_id"}))
@Getter
@EqualsAndHashCode(of = "id")
@NoArgsConstructor(access = AccessLevel.PROTECTED)
public class CoworkerEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false)
    private Long minId;

    @Column(nullable = false)
    private Long maxId;

    @Builder
    public CoworkerEntity(Long minId, Long maxId) {
        this.minId = minId;
        this.maxId = maxId;
    }
}
