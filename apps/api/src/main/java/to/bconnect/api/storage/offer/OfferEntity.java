package to.bconnect.api.storage.offer;

import jakarta.persistence.*;
import lombok.AccessLevel;
import lombok.Getter;
import lombok.NoArgsConstructor;
import to.bconnect.api.storage.BaseEntity;

import java.time.Instant;
import java.time.LocalDate;

@Entity
@Table(name = "offers")
@Getter
@NoArgsConstructor(access = AccessLevel.PROTECTED)
public class OfferEntity extends BaseEntity {

    private Long taskId;

    private Long workerId;

    @Column(name = "seq")
    private int seq;

    private LocalDate due;

    @Enumerated(EnumType.STRING)
    private OfferStatus status = OfferStatus.PENDING;

    private Instant acceptedAt;

    @Version
    private Long version;

    public OfferEntity(Long taskId, Long workerId, int seq) {
        this.taskId = taskId;
        this.workerId = workerId;
        this.seq = seq;
    }

    public void offered() {
        this.status = OfferStatus.ACTIVE;
    }

    public void accept() {
        this.status = OfferStatus.ACCEPTED;
        this.acceptedAt = Instant.now();
    }

    public void deny() {
        this.status = OfferStatus.DENIED;
    }

    public void expire() {
        this.status = OfferStatus.EXPIRED;
    }

    public void updateDue(LocalDate due) {
        this.due = due;
    }

    public void cancel() {
        this.status = OfferStatus.CANCELED;
    }

    public void reorder(int seq) {
        this.seq = seq;
    }
}
