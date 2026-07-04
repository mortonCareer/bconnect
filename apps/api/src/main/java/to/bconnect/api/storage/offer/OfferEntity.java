package to.bconnect.api.storage.offer;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.Table;
import lombok.AccessLevel;
import lombok.Getter;
import lombok.NoArgsConstructor;
import to.bconnect.api.storage.BaseEntity;

import java.time.LocalDate;

@Entity
@Table(name = "offers")
@Getter
@NoArgsConstructor(access = AccessLevel.PROTECTED)
public class OfferEntity extends BaseEntity {

    @Column(nullable = false)
    private Long taskId;

    @Column(nullable = false)
    private Long workerId;

    @Column(name = "seq", nullable = false)
    private int seq;

    @Column(nullable = false)
    private LocalDate due;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private OfferStatus status = OfferStatus.PENDING;

    public OfferEntity(Long taskId, Long workerId, int seq, LocalDate due) {
        this.taskId = taskId;
        this.workerId = workerId;
        this.seq = seq;
        this.due = due;
    }

    public void offered() {
        this.status = OfferStatus.ACTIVE;
    }

    public void accept() {
        this.status = OfferStatus.ACCEPTED;
    }

    public void deny() {
        this.status = OfferStatus.DENIED;
    }

    public void cancel() {
        this.status = OfferStatus.CANCELED;
    }

    public void reorder(int seq) {
        this.seq = seq;
    }
}
