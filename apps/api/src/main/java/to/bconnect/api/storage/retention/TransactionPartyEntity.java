package to.bconnect.api.storage.retention;

import jakarta.persistence.*;
import lombok.AccessLevel;
import lombok.Getter;
import lombok.NoArgsConstructor;

import java.time.Instant;

@Entity
@Table(name = "transaction_parties")
@Getter
@NoArgsConstructor(access = AccessLevel.PROTECTED)
public class TransactionPartyEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    private Long memberId;

    private Long counterpartyId;

    private Instant archivedAt;

    private Instant expireAt;

    public TransactionPartyEntity(Long memberId, Long counterpartyId, Instant archivedAt, Instant expireAt) {
        this.memberId = memberId;
        this.counterpartyId = counterpartyId;
        this.archivedAt = archivedAt;
        this.expireAt = expireAt;
    }
}
