package to.bconnect.api.storage.retention;

import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import lombok.AccessLevel;
import lombok.Getter;
import lombok.NoArgsConstructor;

import java.time.Instant;

@Entity
@Table(name = "transaction_parties")
@Getter
@NoArgsConstructor(access = AccessLevel.PROTECTED)
@RetentionPolicy("P1Y")
public class TransactionPartyEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    private Long memberId;

    private String memberName;

    private String memberPhone;

    private Long counterpartyId;

    private String counterpartyName;

    private String counterpartyBrn;

    private Instant matchedAt;

    private Instant archivedAt;

    private Instant expireAt;

    public TransactionPartyEntity(
            Long memberId,
            String memberName,
            String memberPhone,
            Long counterpartyId,
            String counterpartyName,
            String counterpartyBrn,
            Instant matchedAt,
            Instant archivedAt,
            Instant expireAt
    ) {
        this.memberId = memberId;
        this.memberName = memberName;
        this.memberPhone = memberPhone;
        this.counterpartyId = counterpartyId;
        this.counterpartyName = counterpartyName;
        this.counterpartyBrn = counterpartyBrn;
        this.matchedAt = matchedAt;
        this.archivedAt = archivedAt;
        this.expireAt = expireAt;
    }
}
