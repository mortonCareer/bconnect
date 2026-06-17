package to.bconnect.api.storage.offer;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Index;
import jakarta.persistence.Table;
import lombok.AccessLevel;
import lombok.Getter;
import lombok.NoArgsConstructor;
import to.bconnect.api.storage.BaseEntity;

import java.time.LocalDate;

@Entity
@Table(
        name = "offers",
        indexes = @Index(
                name = "udx_offer_task_profile",
                columnList = "taskId, profileId",
                unique = true
        )
)
@Getter
@NoArgsConstructor(access = AccessLevel.PROTECTED)
public class OfferEntity extends BaseEntity {

    @Column(nullable = false)
    private Long taskId;

    @Column(nullable = false)
    private Long profileId;

    @Column(nullable = false)
    private LocalDate due;

    public OfferEntity(Long taskId, Long profileId, LocalDate due) {
        this.taskId = taskId;
        this.profileId = profileId;
        this.due = due;
    }
}
